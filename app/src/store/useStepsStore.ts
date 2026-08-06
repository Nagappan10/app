import { create } from 'zustand';
import { getDaily, statsForRange, upsertDaily, weeklyStats } from '@/db/walking';
import {
  getPermission,
  getRecentHistory,
  getStepsForDay,
  isAvailable,
  requestPermission,
  SUPPORTS_HISTORY,
  watchSteps,
  type PedometerPermission,
} from '@/services/pedometer';
import type { DayStats, WeeklyWalkingStats } from '@/types';
import { addDays, endOfMonth, startOfMonth, startOfWeek, toDayKey } from '@/utils/date';
import { caloriesFromDailySteps, distanceFromSteps } from '@/utils/metrics';
import { useSettingsStore } from './useSettingsStore';

interface StepsState {
  permission: PedometerPermission;
  available: boolean;
  checking: boolean;

  today: DayStats | null;
  week: WeeklyWalkingStats | null;
  month: DayStats[];
  monthKey: string;

  initialise: () => Promise<void>;
  requestAccess: () => Promise<PedometerPermission>;
  refresh: () => Promise<void>;
  loadMonth: (monthKey: string) => Promise<void>;
  setWeekStart: (start: string) => Promise<void>;
  weekStart: string;

  /** Starts the always-on daily accumulator. Returns a teardown function. */
  startDailyTracking: () => () => void;
}

const emptyDay = (day: string, goal: number): DayStats => ({
  day,
  steps: 0,
  distanceM: 0,
  calories: 0,
  activeMs: 0,
  goal,
  sessions: 0,
});

/**
 * Ambient daily step tracking — the counting that happens whether or not the
 * user ever starts a session.
 *
 * On iOS we simply ask CoreMotion for today's total, which already includes
 * steps taken while the app was closed. On Android there is no history API, so
 * a live subscription feeds an accumulator that is persisted on every update;
 * the platform's since-boot counter keeps running in the sensor hub regardless
 * of our process, so nothing is lost between app launches.
 */
export const useStepsStore = create<StepsState>((set, get) => ({
  permission: 'undetermined',
  available: false,
  checking: true,

  today: null,
  week: null,
  month: [],
  monthKey: toDayKey().slice(0, 7),
  weekStart: startOfWeek(),

  initialise: async () => {
    set({ checking: true });
    const [available, permission] = await Promise.all([isAvailable(), getPermission()]);
    set({ available, permission, checking: false });

    if (permission === 'granted' && available) {
      await backfillHistory();
    }
    await get().refresh();
  },

  requestAccess: async () => {
    const permission = await requestPermission();
    set({ permission });
    if (permission === 'granted') {
      await backfillHistory();
      await get().refresh();
    }
    return permission;
  },

  refresh: async () => {
    const { dailyGoal, strideLength, weightKg } = useSettingsStore.getState();
    const day = toDayKey();

    // Pull the authoritative platform total where one exists.
    if (SUPPORTS_HISTORY) {
      const steps = await getStepsForDay(day);
      if (steps !== null) {
        const existing = await getDaily(day);
        if (steps !== existing?.steps || existing?.goal !== dailyGoal) {
          await upsertDaily(day, {
            steps,
            distanceM: distanceFromSteps(steps, strideLength),
            calories: caloriesFromDailySteps(steps, weightKg),
            goal: dailyGoal,
          });
        }
      }
    }

    const weekStart = get().weekStart;
    const [week, todayRow] = await Promise.all([
      weeklyStats(weekStart, dailyGoal),
      getDaily(day),
    ]);

    set({
      week,
      today:
        week.days.find((d) => d.day === day) ??
        (todayRow
          ? { ...todayRow, sessions: 0 }
          : emptyDay(day, dailyGoal)),
    });

    await get().loadMonth(get().monthKey);
  },

  loadMonth: async (monthKey) => {
    const { dailyGoal } = useSettingsStore.getState();
    const anchor = `${monthKey}-01`;
    const days = await statsForRange(startOfMonth(anchor), endOfMonth(anchor), dailyGoal);
    set({ month: days, monthKey });
  },

  setWeekStart: async (weekStart) => {
    set({ weekStart });
    const { dailyGoal } = useSettingsStore.getState();
    set({ week: await weeklyStats(weekStart, dailyGoal) });
  },

  startDailyTracking: () => {
    if (SUPPORTS_HISTORY) {
      // iOS: poll the platform total rather than accumulate. Cheaper, and it
      // stays correct across app restarts and background time.
      const interval = setInterval(() => {
        void get().refresh();
      }, 30_000);
      return () => clearInterval(interval);
    }

    // Android: accumulate deltas from the live subscription.
    //
    // expo-sensors reports `values[0] - stepsAtTheBeginning`, where the
    // baseline is captured on the first sensor event and deliberately offset by
    // one — so the very first callback always reports 1, never 0. Using `null`
    // rather than `0` as the "no baseline yet" marker keeps that first real
    // step from being silently swallowed, and stays correct even if the
    // platform ever starts reporting a genuine 0.
    let previous: number | null = null;
    let pending = 0;
    let flushing = false;

    const flush = async () => {
      if (flushing || pending === 0) return;
      flushing = true;
      const delta = pending;
      pending = 0;

      try {
        const { dailyGoal, strideLength, weightKg } = useSettingsStore.getState();
        const day = toDayKey();
        const existing = await getDaily(day);
        const steps = (existing?.steps ?? 0) + delta;

        await upsertDaily(day, {
          steps,
          distanceM: distanceFromSteps(steps, strideLength),
          calories: caloriesFromDailySteps(steps, weightKg),
          goal: dailyGoal,
        });

        set((state) => ({
          today: { ...(state.today ?? emptyDay(day, dailyGoal)), steps },
        }));
      } finally {
        flushing = false;
      }
    };

    const stopWatching = watchSteps((cumulative) => {
      if (previous === null) {
        // First event. Its value is the platform's +1 offset, which represents
        // a real step, so bank it rather than discarding it as a baseline.
        previous = cumulative;
        if (cumulative > 0) pending += cumulative;
        return;
      }

      const delta = cumulative - previous;
      previous = cumulative;

      // A negative delta means the counter re-based (process restart or device
      // reboot). Re-baseline instead of subtracting from the day's total.
      if (delta > 0) pending += delta;
    });

    // Batch writes: a SQLite round trip per step would be absurd.
    const flushTimer = setInterval(() => void flush(), 5000);

    return () => {
      stopWatching();
      clearInterval(flushTimer);
      void flush();
    };
  },
}));

/** Seeds the database with whatever history the platform can give us. */
async function backfillHistory(): Promise<void> {
  if (!SUPPORTS_HISTORY) return;

  const { dailyGoal, strideLength, weightKg } = useSettingsStore.getState();
  const history = await getRecentHistory(7);

  for (const [day, steps] of history) {
    if (steps <= 0) continue;
    const existing = await getDaily(day);
    // Never overwrite a larger stored value — the accumulator may know more
    // than the platform's rolling window does.
    if ((existing?.steps ?? 0) >= steps) continue;

    await upsertDaily(day, {
      steps,
      distanceM: distanceFromSteps(steps, strideLength),
      calories: caloriesFromDailySteps(steps, weightKg),
      goal: existing?.goal ?? dailyGoal,
    });
  }
}

/** Convenience selector: yesterday's key, for "vs yesterday" comparisons. */
export const yesterdayKey = () => addDays(toDayKey(), -1);

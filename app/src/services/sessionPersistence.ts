import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pulse-active-session';

/**
 * A snapshot of a walk in progress, written to disk as it happens.
 *
 * Before this existed the live session lived only in memory, so if Android
 * reclaimed the process mid-walk — which it will, given a phone in a pocket
 * with the screen off — the entire session vanished with no record that it had
 * ever started. Persisting the running totals means the worst case degrades
 * from "lost the walk" to "lost the steps from the period we were dead".
 *
 * Written on every state change and on each tick, so a crash at any moment
 * loses at most one tick of progress.
 */
export interface PersistedSession {
  startedAt: number;
  /** Steps banked from stretches that have already ended. */
  bankedSteps: number;
  /** Active milliseconds banked from stretches that have already ended. */
  bankedMs: number;
  /** When the current running stretch began; 0 while paused. */
  resumedAt: number;
  status: 'active' | 'paused';
  /** Last write, used to detect how long we were gone. */
  savedAt: number;
}

export async function saveActiveSession(session: PersistedSession): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Persistence is best-effort; never interrupt a walk over it.
  }
}

export async function loadActiveSession(): Promise<PersistedSession | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedSession;
    if (typeof parsed?.startedAt !== 'number' || parsed.startedAt <= 0) return null;

    // A session older than 24h is almost certainly abandoned rather than
    // resumable — restoring it would show an absurd elapsed time.
    if (Date.now() - parsed.startedAt > 24 * 60 * 60 * 1000) {
      await clearActiveSession();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function clearActiveSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Ignore — a stale entry is discarded by the age check above.
  }
}

/**
 * Active milliseconds a restored session should resume from.
 *
 * Wall-clock time is trustworthy across process death in a way step counts are
 * not: if the session was running when we died, that time really did elapse
 * and the user really was walking through it. Steps from that window are gone,
 * but the duration should not be.
 */
export function elapsedFromSnapshot(snapshot: PersistedSession, now = Date.now()): number {
  if (snapshot.status === 'paused' || snapshot.resumedAt <= 0) return snapshot.bankedMs;
  return snapshot.bankedMs + Math.max(0, now - snapshot.resumedAt);
}

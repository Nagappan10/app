import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { formatDuration } from '@/utils/format';

/**
 * The ongoing notification shown while a walking session is recording.
 *
 * Two jobs. The obvious one is telling you the walk is still being tracked
 * without opening the app. The less obvious one matters more: an ongoing
 * notification is a strong signal to Android that the app is doing something
 * the user cares about, which makes the system far less likely to reclaim the
 * process while you are walking.
 *
 * It is NOT a foreground service, and the distinction is worth being precise
 * about — a notification asks Android nicely, a foreground service tells it.
 * See `startSession` in the session store for what that means in practice.
 */

const CHANNEL_ID = 'pulse-session';
const NOTIFICATION_ID = 'pulse-active-session';

let configured = false;
let currentId: string | null = null;

async function configure(): Promise<void> {
  if (configured) return;
  configured = true;

  // While a session is running the notification is the point, so show it even
  // with the app in the foreground.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Walking session',
      // LOW keeps it silent and un-intrusive: it belongs in the shade, not
      // buzzing the wrist every time the step count changes.
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      enableVibrate: false,
      showBadge: false,
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await configure();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export interface SessionNotificationState {
  steps: number;
  elapsedMs: number;
  distanceM: number;
  paused: boolean;
}

/** Creates or updates the ongoing notification. Safe to call repeatedly. */
export async function showSessionNotification(
  state: SessionNotificationState,
): Promise<void> {
  try {
    await configure();

    const km = (state.distanceM / 1000).toFixed(2);
    const body = `${Math.round(state.steps).toLocaleString()} steps · ${km} km · ${formatDuration(
      state.elapsedMs,
    )}`;

    // Reusing the same identifier replaces the existing notification in place
    // rather than stacking a new one every tick.
    currentId = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: state.paused ? 'Walk paused' : 'Walk in progress',
        body,
        sticky: true, // ongoing: cannot be swiped away while recording
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: null, // immediately
    });
  } catch {
    // A missing notification must never take down a walk in progress.
  }
}

export async function clearSessionNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
    if (currentId && currentId !== NOTIFICATION_ID) {
      await Notifications.dismissNotificationAsync(currentId);
    }
    currentId = null;
  } catch {
    // Nothing to do — an absent notification is the state we wanted.
  }
}

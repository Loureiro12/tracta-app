import { Platform } from 'react-native';

import {
  AndroidImportance,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';

import type { Alerts } from './types';

/** Android plays sound only on channels created with it; one channel for workout timers. */
const CHANNEL_ID = 'timers';

let configured: Promise<void> | null = null;

function configure(): Promise<void> {
  configured ??= (async () => {
    // In the foreground the screen already shows the timer ending: sound only, no banner.
    setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      }),
    });
    if (Platform.OS === 'android') {
      await setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Timers',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  })();
  return configured;
}

/** Local notifications through expo-notifications (APNs / FCM are not involved). */
export const deviceAlerts: Alerts = {
  async ensurePermission() {
    await configure();
    const current = await getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await requestPermissionsAsync();
    return asked.granted;
  },

  async schedule({ at, title, body }) {
    if (!(await this.ensurePermission())) return null;
    return scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: CHANNEL_ID,
      },
    });
  },

  async cancel(id) {
    await cancelScheduledNotificationAsync(id);
  },
};

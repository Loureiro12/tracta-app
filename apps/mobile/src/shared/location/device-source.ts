import { Platform } from 'react-native';

import * as Location from 'expo-location';

import { useLocationStore } from './location.store';
import { LOCATION_TASK, toGeoPoint } from './location.task';

import type { LocationPermission, LocationSource, TrackingOptions } from './location.types';

let watcher: Location.LocationSubscription | null = null;
/** start/stop talk to native code asynchronously: run them one after another. */
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(job: () => Promise<T>): Promise<T> {
  const next = queue.then(job, job);
  queue = next.catch(() => undefined);
  return next;
}

const TRACKING: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  distanceInterval: 5,
  timeInterval: 2000,
};

async function ensureForeground(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Location.requestForegroundPermissionsAsync()).granted;
}

/** Real GPS: background task when the OS allows it, foreground watcher otherwise. */
export const deviceSource: LocationSource = {
  requestPermission: async (): Promise<LocationPermission> => {
    if (!(await ensureForeground())) return 'denied';
    // iOS: "Always" keeps fixes coming with the screen locked. Android records a locked-screen
    // run through the foreground service with the foreground grant, and its background prompt
    // only opens system settings, so it is not asked for there.
    if (Platform.OS !== 'ios') return 'foreground';
    const bg = await Location.requestBackgroundPermissionsAsync().catch(() => null);
    return bg?.granted ? 'always' : 'foreground';
  },

  start: ({ notification }: TrackingOptions) =>
    serial(async () => {
      const store = useLocationStore.getState();
      if (store.tracking) return true;
      if (!(await Location.hasServicesEnabledAsync().catch(() => false))) return false;
      if (!(await ensureForeground())) return false;
      store.setTracking(true);
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, {
          ...TRACKING,
          activityType: Location.ActivityType.Fitness,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: notification.title,
            notificationBody: notification.body,
            killServiceOnDestroy: true,
          },
        });
      } catch {
        // No background capability (permission or OS policy): record while the app is open.
        try {
          watcher = await Location.watchPositionAsync(TRACKING, (l) =>
            useLocationStore.getState().addPoints([toGeoPoint(l)]),
          );
        } catch {
          store.setTracking(false);
          return false;
        }
      }
      return true;
    }),

  stop: () => {
    useLocationStore.getState().setTracking(false);
    return serial(async () => {
      useLocationStore.getState().setTracking(false);
      watcher?.remove();
      watcher = null;
      if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => undefined);
      }
    });
  },
};

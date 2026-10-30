import * as TaskManager from 'expo-task-manager';

import { useLocationStore } from './location.store';

import type { GeoPoint } from './location.types';
import type { LocationObject } from 'expo-location';

/** Background task that receives fixes while the screen is locked (expo-location + task manager). */
export const LOCATION_TASK = 'tracta.run-location';

export function toGeoPoint(l: LocationObject): GeoPoint {
  return {
    lat: l.coords.latitude,
    lng: l.coords.longitude,
    t: l.timestamp,
    accuracy: l.coords.accuracy ?? null,
  };
}

/**
 * expo-task-manager requires the task to be defined at module scope of the JS entry, so the OS
 * can deliver background fixes even before any screen mounts. Called once by AppProviders.
 */
export function defineLocationTask(): void {
  if (TaskManager.isTaskDefined(LOCATION_TASK)) return;
  TaskManager.defineTask<{ locations?: LocationObject[] }>(
    LOCATION_TASK,
    async ({ data, error }) => {
      if (error || !data?.locations) return;
      useLocationStore.getState().addPoints(data.locations.map(toGeoPoint));
    },
  );
}

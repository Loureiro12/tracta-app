import { env } from '@/shared/config/env';

import { deviceSource } from './device-source';
import { FAKE_TIME_SCALE, fakeSource } from './fake-source';

import type { LocationSource } from './location.types';

/** GPS used by activities: the device, or the deterministic playback in E2E builds. */
export const locationSource: LocationSource = env.isE2E ? fakeSource : deviceSource;

/**
 * Activity seconds per real second. 1 on devices; the E2E fake compresses time, so activity
 * clocks (and the pace derived from points) must scale by the same factor.
 */
export const activityTimeScale = env.isE2E ? FAKE_TIME_SCALE : 1;

export { useLocationStore } from './location.store';
export { defineLocationTask } from './location.task';
export type {
  GeoPoint,
  LocationPermission,
  LocationSource,
  TrackingOptions,
} from './location.types';

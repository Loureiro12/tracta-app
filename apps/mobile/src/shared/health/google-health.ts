import { ApiError, googleHealth } from '@/shared/api';

import { fakeHealthSource } from './fake';
import {
  getGoogleHealthToken,
  hasGoogleHealthToken,
  signInToGoogleHealth,
  signOutOfGoogleHealth,
} from './google-auth';

import type { GoogleHealthClient, HealthSource } from './types';

const context = { getToken: getGoogleHealthToken };

/** Signed in to Google, but the account has no Google Health profile to read from yet. */
export class GoogleHealthNoProfile extends Error {
  constructor() {
    super('This Google account has no Google Health profile');
    this.name = 'GoogleHealthNoProfile';
  }
}

/**
 * Google Health through its cloud API (iOS has no on-device store for it). Read-only: nothing the
 * user records in Tracta is sent to Google.
 */
export const googleHealthSource: HealthSource & GoogleHealthClient = {
  kind: 'google_health',
  isFake: false,
  isAvailable: () => Promise.resolve(true),
  requestPermissions: async () => {
    if (!(await signInToGoogleHealth())) return false;
    try {
      await googleHealth.getIdentity(context);
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'forbidden' || error.code === 'not_found')) {
        await signOutOfGoogleHealth();
        throw new GoogleHealthNoProfile();
      }
      throw error;
    }
    return true;
  },
  readDayActivity: (range) => googleHealth.readDayActivity(context, range),
  readSleepSessions: (range) => googleHealth.readSleepSessions(context, range),
  readHeartRate: (range) => googleHealth.readHeartRate(context, range),
  saveWorkout: () => Promise.resolve(false),
  isLinked: hasGoogleHealthToken,
  signOut: signOutOfGoogleHealth,
};

/** E2E builds never reach Google: same deterministic data as the other sources. */
export const fakeGoogleHealthSource: HealthSource & GoogleHealthClient = {
  ...fakeHealthSource,
  kind: 'google_health',
  requestPermissions: () => Promise.resolve(true),
  isLinked: () => Promise.resolve(true),
  signOut: () => Promise.resolve(),
};

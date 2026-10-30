import { Platform } from 'react-native';

import { env } from '@/shared/config/env';

import { fakeHealthSource } from './fake';
import { healthConnectSource } from './health-connect';
import { healthKitSource } from './healthkit';

import type { HealthSource } from './types';

let resolved: Promise<HealthSource | null> | null = null;

/**
 * The device's Health store: the deterministic fake in E2E builds, Apple Health on iOS and
 * Health Connect on Android. In development, a simulator/emulator without the native store falls
 * back to the fake so the screens still show data. Null = no Health store on this device.
 */
export function getHealthSource(): Promise<HealthSource | null> {
  resolved ??= (async () => {
    if (env.isE2E) return fakeHealthSource;
    const native =
      Platform.OS === 'ios'
        ? healthKitSource
        : Platform.OS === 'android'
          ? healthConnectSource
          : null;
    if (native && (await native.isAvailable())) return native;
    return env.isDev ? fakeHealthSource : null;
  })();
  return resolved;
}

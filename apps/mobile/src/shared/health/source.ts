import { Platform } from 'react-native';

import { env } from '@/shared/config/env';

import { fakeHealthSource } from './fake';
import { fakeGoogleHealthSource, googleHealthSource } from './google-health';
import { healthConnectSource } from './health-connect';
import { healthKitSource } from './healthkit';

import type { GoogleHealthClient, HealthSource, HealthSourceKind } from './types';

let resolved: Promise<HealthSource | null> | null = null;

/**
 * The device's Health store: the deterministic fake in E2E builds, Apple Health on iOS and
 * Health Connect on Android. In development, a simulator/emulator without the native store falls
 * back to the fake so the screens still show data. Null = no Health store on this device.
 * `kind` is the connection's source: Google Health isn't tied to the device, so it's asked by name.
 */
export function getHealthSource(kind?: HealthSourceKind): Promise<HealthSource | null> {
  if (kind === 'google_health') return Promise.resolve(getGoogleHealthSource());
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

export function getGoogleHealthSource(): HealthSource & GoogleHealthClient {
  return env.isE2E ? fakeGoogleHealthSource : googleHealthSource;
}

/** On Android, Google Health reaches the app through Health Connect, with no sign-in of its own. */
export function isGoogleHealthAvailable(): boolean {
  return env.isE2E || (Platform.OS === 'ios' && Boolean(env.googleHealthIosClientId));
}

const SOURCE_NAMES: Record<string, string> = {
  apple_health: 'Apple Health',
  health_connect: 'Health Connect',
  google_health: 'Google Health',
};

/** The product's name, which isn't translated. */
export function healthSourceName(kind: string): string {
  return SOURCE_NAMES[kind] ?? kind;
}

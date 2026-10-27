import Constants from 'expo-constants';

/** Typed access to build-time configuration. Extend here, never read process.env elsewhere. */
export const env = {
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  isDev: __DEV__,
  /** Release builds made for the E2E suite set EXPO_PUBLIC_E2E=1 at build time. */
  isE2E: process.env.EXPO_PUBLIC_E2E === '1',
  /** Dev-only affordances (design-system gallery link) that E2E also needs to reach. */
  showDevTools: __DEV__ || process.env.EXPO_PUBLIC_E2E === '1',
} as const;

import Constants from 'expo-constants';

/** Typed access to build-time configuration. Extend here, never read process.env elsewhere. */
export const env = {
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  isDev: __DEV__,
} as const;

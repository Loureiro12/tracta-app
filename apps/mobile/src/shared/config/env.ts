import { Platform } from 'react-native';

import Constants from 'expo-constants';

const isE2E = process.env.EXPO_PUBLIC_E2E === '1';

/**
 * Local Supabase started with `supabase start` (ports 553xx, see supabase/config.toml).
 * The anon key below is the public demo key every local Supabase uses; it is not a secret.
 */
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:55321';
const LOCAL_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/** Android emulators reach the host machine through 10.0.2.2, not 127.0.0.1. */
function reachable(url: string): string {
  return Platform.OS === 'android'
    ? url.replace(/\/\/(127\.0\.0\.1|localhost)/, '//10.0.2.2')
    : url;
}

function supabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) return { url: reachable(url), anonKey };
  if (__DEV__ || isE2E)
    return { url: reachable(LOCAL_SUPABASE_URL), anonKey: LOCAL_SUPABASE_ANON_KEY };
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are required in release builds.',
  );
}

/** Typed access to build-time configuration. Extend here, never read process.env elsewhere. */
export const env = {
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  isDev: __DEV__,
  /** Release builds made for the E2E suite set EXPO_PUBLIC_E2E=1 at build time. */
  isE2E,
  /** Dev-only affordances (design-system gallery link, e2e sign-in) that E2E also needs to reach. */
  showDevTools: __DEV__ || isE2E,
  /** Freezes "today" (YYYY-MM-DD) so demo data and E2E assertions line up. */
  fixedToday: process.env.EXPO_PUBLIC_FIXED_TODAY ?? (isE2E ? '2026-10-26' : undefined),
  supabase: supabaseConfig(),
} as const;

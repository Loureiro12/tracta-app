import { AppState } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { createTractaClient } from '@tracta/api';

import { env } from '@/shared/config/env';

/** The app's single Supabase client. Session persists in AsyncStorage and refreshes while active. */
export const supabase = createTractaClient({
  url: env.supabase.url,
  key: env.supabase.anonKey,
  storage: AsyncStorage,
});

// Supabase recommends pausing token refresh while the app is in the background.
AppState.addEventListener('change', (state) => {
  if (state === 'active') void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});

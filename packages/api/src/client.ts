import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import type { SupabaseClient, SupportedStorage } from '@supabase/supabase-js';

export type TractaClient = SupabaseClient<Database>;

export type TractaClientOptions = {
  url: string;
  /** Anon/publishable key in apps; the service role key only in tests/back-office. */
  key: string;
  /** Where the session is persisted (AsyncStorage in the app). Omit for in-memory sessions. */
  storage?: SupportedStorage;
  /** Keep the session across restarts and refresh tokens automatically. Default: true with storage. */
  persistSession?: boolean;
};

export function createTractaClient({
  url,
  key,
  storage,
  persistSession,
}: TractaClientOptions): TractaClient {
  const persist = persistSession ?? Boolean(storage);
  return createClient<Database>(url, key, {
    auth: {
      ...(storage ? { storage } : {}),
      persistSession: persist,
      autoRefreshToken: persist,
      // React Native has no URL bar to parse sessions from.
      detectSessionInUrl: false,
    },
  });
}

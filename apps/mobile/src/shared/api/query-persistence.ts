import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient, removeOldestQuery } from '@tanstack/react-query-persist-client';

import { env } from '@/shared/config/env';

import { CACHE_MAX_AGE_MS, queryClient } from './query-client';

import type { QueryKey } from '@tanstack/react-query';

const cacheKey = (userId: string) => `tracta.query-cache.${userId}`;

/**
 * What the app shows with no internet. It's a list because everything persisted is one AsyncStorage
 * value (Android can't read one over 2 MB), and only JSON-safe results survive the round trip:
 * history's evolution charts hold Dates, photos hold signed URLs that expire.
 */
const HISTORY_PARTS: ReadonlySet<unknown> = new Set([
  'weekly',
  'home-recent',
  'month',
  'records',
  'health-window',
]);
function isPersisted(key: QueryKey): boolean {
  const [root, part] = key;
  if (root === 'history') return HISTORY_PARTS.has(part);
  return ['routines', 'exercises', 'programs', 'account', 'body'].includes(String(root));
}

/** Restores this user's cache and keeps saving it. Resolves with the function that stops it. */
export async function startQueryPersistence(userId: string): Promise<() => void> {
  const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: cacheKey(userId),
    throttleTime: 2000,
    retry: removeOldestQuery,
  });
  const [stop, restored] = persistQueryClient({
    queryClient,
    persister,
    maxAge: CACHE_MAX_AGE_MS,
    buster: env.appVersion,
    dehydrateOptions: {
      shouldDehydrateQuery: (q) => q.state.status === 'success' && isPersisted(q.queryKey),
    },
  });
  await restored;
  return stop;
}

/** A signed-out device keeps no copy of the account's data. */
export function clearPersistedQueries(userId: string): Promise<void> {
  return AsyncStorage.removeItem(cacheKey(userId));
}

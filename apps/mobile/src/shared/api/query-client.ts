import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@tracta/api';

/** How long results stay usable with no internet (the persisted cache lives as long). */
export const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Server-state cache. Validation/permission errors are not retried; network blips are. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: CACHE_MAX_AGE_MS,
      retry: (failures, error) =>
        failures < 2 &&
        !(error instanceof ApiError && error.code !== 'network' && error.code !== 'unknown'),
    },
    // The default ('online') would pause a mutation with no internet and spin its button forever.
    mutations: { retry: false, networkMode: 'always' },
  },
});

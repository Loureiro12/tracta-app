import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@tracta/api';

/** Server-state cache. Validation/permission errors are not retried; network blips are. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failures, error) =>
        failures < 2 &&
        !(error instanceof ApiError && error.code !== 'network' && error.code !== 'unknown'),
    },
    mutations: { retry: false },
  },
});

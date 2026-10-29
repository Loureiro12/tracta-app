// Server access for features: the typed client, the shared React Query cache and the api package.
export { supabase } from './client';
export { queryClient } from './query-client';
export {
  ApiError,
  account,
  activities,
  auth,
  body,
  exercises,
  history,
  notifications,
  programs,
  routines,
  sessions,
  social,
} from '@tracta/api';
export type { Account, ApiErrorCode, AuthUser, Goals, Settings, Subscription } from '@tracta/api';
export { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

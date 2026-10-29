import { social, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';

import { socialKeys } from './socialKeys';

/** Pending requests: received (accept/decline) and sent (waiting). */
export function useFriendRequests() {
  return useQuery({
    queryKey: socialKeys.requests,
    queryFn: () => social.listRequests(supabase),
  });
}

/** Accepts or declines a received request; refreshes friends, requests and suggestions. */
export function useRespondRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      accept
        ? social.acceptRequest(supabase, requestId)
        : social.removeRequest(supabase, requestId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.all }),
  });
}

/** Ends a friendship. */
export function useUnfriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => social.unfriend(supabase, friendId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.all }),
  });
}

import { social, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';

import { socialKeys } from './socialKeys';

/** Friends of friends not connected yet (the invite screen's contacts). */
export function useSuggestions() {
  return useQuery({
    queryKey: socialKeys.suggestions,
    queryFn: () => social.listSuggestions(supabase),
  });
}

/** Sends a friend request by @handle (accepts instead when they already invited the user). */
export function useSendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (handle: string) => social.sendRequest(supabase, handle),
    onSuccess: (result) =>
      queryClient.setQueryData<social.Suggestion[]>(socialKeys.suggestions, (list) =>
        list?.map((s) => (s.id === result.toId ? { ...s, invited: true } : s)),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.all }),
  });
}

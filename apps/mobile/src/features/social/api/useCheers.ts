import { social, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { today } from '@/shared/clock';

import { socialKeys } from './socialKeys';

/** User ids of the friends cheered today. */
export function useCheers() {
  const day = today();
  return useQuery({
    queryKey: socialKeys.cheers(day),
    queryFn: () => social.listCheers(supabase, day),
  });
}

/** Cheers / un-cheers a friend's day, updating the button immediately. */
export function useToggleCheer() {
  const queryClient = useQueryClient();
  const day = today();
  const key = socialKeys.cheers(day);
  return useMutation({
    mutationFn: ({ friendId, cheered }: { friendId: string; cheered: boolean }) =>
      cheered ? social.uncheer(supabase, friendId, day) : social.cheer(supabase, friendId, day),
    onMutate: async ({ friendId, cheered }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key);
      queryClient.setQueryData<string[]>(key, (ids = []) =>
        cheered ? ids.filter((id) => id !== friendId) : [...ids, friendId],
      );
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

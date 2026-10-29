import { social, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { today } from '@/shared/clock';

import { socialKeys } from './socialKeys';

/** Challenges the user takes part in. */
export function useChallenges() {
  return useQuery({
    queryKey: socialKeys.challenges,
    queryFn: () => social.listChallenges(supabase),
  });
}

/** Challenge + per member/day points up to today (ranking, grid and feed). */
export function useChallengeBoard(id: string) {
  const day = today();
  return useQuery({
    queryKey: socialKeys.board(id, day),
    queryFn: () => social.getChallengeBoard(supabase, id, day),
    enabled: id.length > 0,
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof social.createChallenge>[1]) =>
      social.createChallenge(supabase, input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.challenges }),
  });
}

/** Leaves a challenge; it disappears from the hub right away. */
export function useLeaveChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => social.leaveChallenge(supabase, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: socialKeys.challenges });
      const previous = queryClient.getQueryData<social.Challenge[]>(socialKeys.challenges);
      queryClient.setQueryData<social.Challenge[]>(socialKeys.challenges, (list) =>
        list?.filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) =>
      queryClient.setQueryData(socialKeys.challenges, context?.previous),
    onSuccess: (_data, id) =>
      queryClient.removeQueries({ queryKey: ['social', 'board', id] as const }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.challenges }),
  });
}

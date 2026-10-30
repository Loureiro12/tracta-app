import { invites, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { getCurrentLocale } from '@/shared/i18n';

import { socialKeys } from './socialKeys';

/** Pending e-mail invites sent by the user ("waiting for sign-up" in the hub). */
export function useEmailInvites() {
  return useQuery({
    queryKey: socialKeys.emailInvites,
    queryFn: () => invites.listEmailInvites(supabase),
  });
}

/**
 * Invites an e-mail address through the invite-friend edge function. The e-mail copy follows the
 * app language. An address that already has an account receives a friend request instead.
 */
export function useInviteByEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => invites.inviteByEmail(supabase, email, getCurrentLocale()),
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.all }),
  });
}

/** Cancels a pending e-mail invite (removed from the list right away). */
export function useRevokeEmailInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => invites.revokeEmailInvite(supabase, inviteId),
    onSuccess: (_, inviteId) =>
      queryClient.setQueryData<invites.EmailInvite[]>(socialKeys.emailInvites, (list) =>
        list?.filter((i) => i.id !== inviteId),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.emailInvites }),
  });
}

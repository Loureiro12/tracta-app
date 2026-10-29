import { account, supabase, useMutation, useQueryClient } from '@/shared/api';
import { accountQueryKey, useAccount, useSession } from '@/shared/session';

import type { PrivacyKey, SocialPrivacy } from '../model/social.types';
import type { Account } from '@/shared/api';

/** Loads and personal records are private by default (prototype `sPriv`). */
const DEFAULT_PRIVACY: SocialPrivacy = {
  done: true,
  kind: true,
  streak: true,
  loads: false,
  prs: false,
};

/** What friends see (user_settings.share_*), from the account query. */
export function usePrivacy(): SocialPrivacy {
  const { data } = useAccount();
  return data?.settings.share ?? DEFAULT_PRIVACY;
}

/** Flips one sharing switch, optimistically. */
export function useSetPrivacy() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const key = accountQueryKey(user?.id);
  return useMutation({
    mutationFn: ({ key: k, value }: { key: PrivacyKey; value: boolean }) =>
      account.updateSettings(supabase, { share: { [k]: value } }),
    onMutate: async ({ key: k, value }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Account>(key);
      if (previous) {
        queryClient.setQueryData<Account>(key, {
          ...previous,
          settings: { ...previous.settings, share: { ...previous.settings.share, [k]: value } },
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

import { account, supabase, useQuery } from '@/shared/api';

import { useSession } from './session.store';

/** Query key for the signed-in account; mutations that change profile/settings/goals invalidate it. */
export const accountQueryKey = (userId: string | undefined) => ['account', userId] as const;

/** Profile + settings + goals of the signed-in user (server state). */
export function useAccount() {
  const { user } = useSession();
  return useQuery({
    queryKey: accountQueryKey(user?.id),
    queryFn: () => account.getAccount(supabase),
    enabled: Boolean(user),
  });
}

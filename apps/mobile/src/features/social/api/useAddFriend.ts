import { social, supabase, useQuery } from '@/shared/api';

import { socialKeys } from './socialKeys';

/** The person behind an invite link (null for unknown handles and for the user's own). */
export function useProfileByHandle(handle: string) {
  return useQuery({
    queryKey: [...socialKeys.all, 'profile', handle.toLowerCase()],
    queryFn: () => social.findByHandle(supabase, handle),
    enabled: handle.length > 0,
    retry: false,
  });
}

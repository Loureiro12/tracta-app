import { useMutation } from '@/shared/api';
import { saveThroughOutbox } from '@/shared/outbox';
import { useSession } from '@/shared/session';

import type { activities as api } from '@tracta/api';

/**
 * Keeps the finished activity on the device and sends it when possible (right away if online).
 * `sent` is false when it will upload later; the outbox refreshes History and writes it to
 * Apple Health / Health Connect once it arrives.
 */
export function useSaveActivity() {
  const { user } = useSession();
  return useMutation({
    mutationFn: (payload: api.SaveActivityInput) =>
      saveThroughOutbox(user?.id ?? '', { kind: 'activity', payload }),
  });
}

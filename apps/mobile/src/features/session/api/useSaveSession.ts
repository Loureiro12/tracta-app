import { useMutation } from '@/shared/api';
import { saveThroughOutbox } from '@/shared/outbox';
import { useSession } from '@/shared/session';

import type { sessions as api } from '@tracta/api';

/**
 * Keeps the finished session on the device and sends it when possible (right away if online).
 * `sent` is false when it will upload later; the outbox refreshes the queries and writes it to
 * the connected Health source once it arrives.
 */
export function useSaveSession() {
  const { user } = useSession();
  return useMutation({
    mutationFn: (payload: api.SaveSessionInput) =>
      saveThroughOutbox(user?.id ?? '', { kind: 'session', payload }),
  });
}

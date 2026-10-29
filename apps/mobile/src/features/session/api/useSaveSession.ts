import { sessions, supabase, useMutation, useQueryClient } from '@/shared/api';

import type { sessions as api } from '@tracta/api';

/** Saves the finished session, then refreshes History, routines (last sets) and exercise history. */
export function useSaveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.SaveSessionInput) => sessions.saveSession(supabase, input),
    onSuccess: () =>
      Promise.all(
        [['history'], ['sessions'], ['routines'], ['exercises']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

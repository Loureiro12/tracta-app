import { activities, supabase, useMutation, useQueryClient } from '@/shared/api';

import type { activities as api } from '@tracta/api';

/** Saves the finished activity, then refreshes History (calendar, evolution, records). */
export function useSaveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.SaveActivityInput) => activities.saveActivity(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  });
}

import { routines, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { useSession } from '@/shared/session';

import { toRoutine } from '../model/workouts.mappers';

import type { Routine } from '../model/workouts.types';

/** Query keys of the routines domain (invalidate `['routines']` to refresh everything). */
export const routinesKeys = {
  all: ['routines'] as const,
  list: (userId: string | undefined) => ['routines', userId, 'list'] as const,
};

/** The user's routines (A/B/C…) with exercises, last sets and last-done dates. */
export function useRoutines() {
  const { user } = useSession();
  return useQuery({
    queryKey: routinesKeys.list(user?.id),
    queryFn: async (): Promise<Routine[]> => (await routines.listRoutines(supabase)).map(toRoutine),
    enabled: Boolean(user),
  });
}

/** One routine by uuid (served from the routines list). */
export function useRoutine(id: string | undefined) {
  const query = useRoutines();
  return { ...query, data: query.data?.find((r) => r.id === id) };
}

/** Creates or updates a routine (exercises replaced atomically). Resolves with the saved routine. */
export function useSaveRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: routines.RoutineInput) =>
      toRoutine(await routines.saveRoutine(supabase, input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: routinesKeys.all }),
  });
}

/** Copies a routine under the next free label; `name` builds the copy's name from it. */
export function useDuplicateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: (label: string) => string }) =>
      toRoutine(await routines.duplicateRoutine(supabase, input.id, { name: input.name })),
    onSuccess: () => qc.invalidateQueries({ queryKey: routinesKeys.all }),
  });
}

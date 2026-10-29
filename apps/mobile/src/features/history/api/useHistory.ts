import {
  activities,
  history,
  sessions,
  supabase,
  useMutation,
  useQuery,
  useQueryClient,
} from '@/shared/api';
import { now, toDateKey } from '@/shared/clock';

import { monthBounds } from '../lib/month';
import { EVOLUTION_WEEKS } from '../model/history.evolution';

import type { history as api } from '@tracta/api';

export const historyKeys = {
  all: ['history'] as const,
  month: (key: string) => ['history', 'month', key] as const,
  entry: (id: string) => ['history', 'entry', id] as const,
  evolution: (from: string) => ['history', 'evolution', from] as const,
  records: ['history', 'records'] as const,
};

/** Month view (entries, totals, routine plan) of the month containing `anchor` (default: today). */
export function useHistoryMonth(anchor?: Date) {
  const bounds = monthBounds(anchor ?? now());
  return useQuery({
    queryKey: historyKeys.month(bounds.key),
    queryFn: () => history.getMonth(supabase, { from: bounds.from, to: bounds.to }),
  });
}

/** Session or activity detail by id (null = not found). */
export function useEntryDetail(id: string | undefined) {
  return useQuery({
    queryKey: historyKeys.entry(id ?? ''),
    queryFn: () => history.getEntryDetail(supabase, id ?? ''),
    enabled: Boolean(id),
  });
}

/** Series of the last 12 weeks (strength per exercise and runs). */
export function useEvolution() {
  const start = now();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - EVOLUTION_WEEKS * 7);
  const from = toDateKey(start);
  return useQuery({
    queryKey: historyKeys.evolution(from),
    queryFn: () => history.getEvolution(supabase, { from: start.toISOString() }),
  });
}

export function useRecords(exerciseSlugs: readonly string[]) {
  return useQuery({
    queryKey: historyKeys.records,
    queryFn: () => history.getRecords(supabase, { exerciseSlugs: [...exerciseSlugs] }),
  });
}

export type DeleteTarget = { id: string; kind: 'strength' | 'activity' };

/**
 * Deletes a session or activity. The entry leaves the cached months right away; History
 * (calendar, totals, evolution, records) refetches before the mutation resolves.
 */
export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, kind }: DeleteTarget) => {
      if (kind === 'strength') await sessions.deleteSession(supabase, id);
      else await activities.deleteActivity(supabase, id);
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['history', 'month'] });
      const previous = queryClient.getQueriesData<api.MonthView>({
        queryKey: ['history', 'month'],
      });
      for (const [key, view] of previous) {
        if (!view) continue;
        const removed = view.entries.find((e) => e.id === id);
        if (!removed) continue;
        queryClient.setQueryData<api.MonthView>(key, {
          ...view,
          entries: view.entries.filter((e) => e.id !== id),
          totals: {
            workouts: view.totals.workouts - 1,
            runKm:
              view.totals.runKm - (removed.kind === 'run' ? (removed.distanceM ?? 0) / 1000 : 0),
            volumeKg: view.totals.volumeKg - (removed.volumeKg ?? 0),
          },
        });
      }
      return { previous };
    },
    onError: (_error, _target, context) => {
      for (const [key, view] of context?.previous ?? []) queryClient.setQueryData(key, view);
    },
    // Awaited before the caller's onSuccess, so History is fresh when the detail closes. The
    // open detail itself is not refetched (it would flash "not found" on the way out).
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: historyKeys.all,
          predicate: (q) => q.queryKey[1] !== 'entry',
        }),
        queryClient.invalidateQueries({ queryKey: ['routines'] }),
        queryClient.invalidateQueries({ queryKey: ['exercises'] }),
      ]),
  });
}

/** Saves the notes of a session or activity. */
export function useUpdateNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, kind, notes }: DeleteTarget & { notes: string }) => {
      if (kind === 'strength') await sessions.updateSessionNotes(supabase, id, notes);
      else await activities.updateActivityNotes(supabase, id, notes);
    },
    onSuccess: (_data, { id }) =>
      queryClient.invalidateQueries({ queryKey: historyKeys.entry(id) }),
  });
}

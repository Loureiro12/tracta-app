import { useEffect, useRef } from 'react';

import { exercises, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { useSession } from '@/shared/session';

import { routinesKeys } from './useRoutines';
import { sortLibrary, toLibraryExercise } from '../model/workouts.mappers';

import type { LibraryExercise } from '../model/workouts.types';

type QueryClient = ReturnType<typeof useQueryClient>;

/** Query keys of the exercises domain (invalidate `['exercises']` to refresh everything). */
export const exercisesKeys = {
  all: ['exercises'] as const,
  library: (userId: string | undefined) => ['exercises', userId, 'library'] as const,
  history: (userId: string | undefined, id: string) =>
    ['exercises', userId, 'history', id] as const,
};

/** Built-in + custom exercises with favorites/notes; favorites first. */
export function useExerciseLibrary() {
  const { user } = useSession();
  return useQuery({
    queryKey: exercisesKeys.library(user?.id),
    queryFn: async (): Promise<LibraryExercise[]> =>
      sortLibrary((await exercises.listExercises(supabase)).map(toLibraryExercise)),
    enabled: Boolean(user),
  });
}

/** One library exercise by uuid (served from the library). */
export function useExercise(id: string | undefined) {
  const query = useExerciseLibrary();
  return { ...query, data: query.data?.find((e) => e.id === id) };
}

/** Logged history of one exercise (last session sets, best set, session count). */
export function useExerciseHistory(id: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: exercisesKeys.history(user?.id, id),
    queryFn: () => exercises.getExerciseHistory(supabase, id),
    enabled: Boolean(user),
  });
}

function useInvalidateTraining() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: exercisesKeys.all }),
      qc.invalidateQueries({ queryKey: routinesKeys.all }),
    ]);
}

/** Registers a custom exercise; resolves with it (mapped). */
export function useCreateExercise() {
  const invalidate = useInvalidateTraining();
  return useMutation({
    mutationFn: async (input: exercises.ExerciseInput) =>
      toLibraryExercise(await exercises.createExercise(supabase, input)),
    onSuccess: invalidate,
  });
}

export function useUpdateExercise() {
  const invalidate = useInvalidateTraining();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: exercises.ExerciseInput }) =>
      toLibraryExercise(await exercises.updateExercise(supabase, id, input)),
    onSuccess: invalidate,
  });
}

/** Deletes a custom exercise (`conflict` while a routine or session uses it). */
export function useDeleteExercise() {
  const invalidate = useInvalidateTraining();
  return useMutation({
    mutationFn: (id: string) => exercises.deleteExercise(supabase, id),
    onSuccess: invalidate,
  });
}

/** Favorite toggle with an optimistic update of the library. */
export function useToggleFavorite() {
  const qc = useQueryClient();
  const { user } = useSession();
  const key = exercisesKeys.library(user?.id);
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      exercises.setFavorite(supabase, id, favorite),
    onMutate: async ({ id, favorite }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<LibraryExercise[]>(key);
      qc.setQueryData<LibraryExercise[]>(key, (list) =>
        list?.map((e) => (e.id === id ? { ...e, favorite } : e)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => qc.setQueryData(key, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

async function persistNotes(
  qc: QueryClient,
  userId: string | undefined,
  exerciseId: string,
  notes: string,
): Promise<void> {
  const key = exercisesKeys.library(userId);
  qc.setQueryData<LibraryExercise[]>(key, (list) =>
    list?.map((e) => (e.id === exerciseId ? { ...e, personalNotes: notes } : e)),
  );
  try {
    await exercises.setNotes(supabase, exerciseId, notes);
  } finally {
    await qc.invalidateQueries({ queryKey: key });
  }
}

/**
 * Saves the personal notes of an exercise 600 ms after the last change (`value` null = untouched),
 * and flushes a pending change when the screen goes away.
 */
export function useExerciseNotesAutosave(id: string, value: string | null) {
  const qc = useQueryClient();
  const userId = useSession().user?.id;
  const pending = useRef<string | null>(null);

  useEffect(() => {
    if (value === null) return;
    pending.current = value;
    const handle = setTimeout(() => {
      pending.current = null;
      void persistNotes(qc, userId, id, value);
    }, 600);
    return () => clearTimeout(handle);
  }, [qc, userId, id, value]);

  useEffect(
    () => () => {
      if (pending.current !== null) void persistNotes(qc, userId, id, pending.current);
      pending.current = null;
    },
    [qc, userId, id],
  );
}

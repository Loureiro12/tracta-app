import { programs, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { today } from '@/shared/clock';
import { useSession } from '@/shared/session';

import { toRace, toRaceInput } from '../model/workouts.mappers';

import type { ActiveProgram, Race } from '../model/workouts.types';

/** Query keys of the programs domain (catalog, enrollment and race). */
export const programsKeys = {
  all: ['programs'] as const,
  catalog: (userId: string | undefined) => ['programs', userId, 'catalog'] as const,
  enrollment: (userId: string | undefined) => ['programs', userId, 'enrollment'] as const,
  race: (userId: string | undefined) => ['programs', userId, 'race'] as const,
};

/** Program catalog (PRO). */
export function usePrograms() {
  const { user } = useSession();
  return useQuery({
    queryKey: programsKeys.catalog(user?.id),
    queryFn: () => programs.listPrograms(supabase),
    enabled: Boolean(user),
    staleTime: Infinity,
  });
}

/** The active program with its current week (from the app clock), or null. */
export function useEnrollment() {
  const { user } = useSession();
  const catalog = usePrograms();
  const enrollment = useQuery({
    queryKey: programsKeys.enrollment(user?.id),
    queryFn: () => programs.getEnrollment(supabase),
    enabled: Boolean(user),
  });
  const e = enrollment.data;
  const program = e ? (catalog.data?.find((p) => p.id === e.programId) ?? null) : null;
  const active: ActiveProgram | null =
    e && program
      ? { id: e.programId, startedOn: e.startedOn, week: programs.currentWeek(e, program, today()) }
      : null;
  return {
    ...enrollment,
    isLoading: enrollment.isLoading || catalog.isLoading,
    data: active,
    program,
  };
}

/** Starts (or switches to) a program today. */
export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => programs.enroll(supabase, { programId, startedOn: today() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: programsKeys.all }),
  });
}

export function useEndEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => programs.endEnrollment(supabase),
    onSuccess: () => qc.invalidateQueries({ queryKey: programsKeys.all }),
  });
}

/** The race goal ("Minha prova") as the editable model, or null. */
export function useRace() {
  const { user } = useSession();
  return useQuery({
    queryKey: programsKeys.race(user?.id),
    queryFn: async (): Promise<Race | null> => {
      const race = await programs.getRace(supabase);
      return race ? toRace(race, today()) : null;
    },
    enabled: Boolean(user),
  });
}

export function useSaveRace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ race, date }: { race: Race; date: Date }) =>
      programs.saveRace(supabase, toRaceInput(race, date)),
    onSuccess: () => qc.invalidateQueries({ queryKey: programsKeys.all }),
  });
}

export function useDeleteRace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => programs.deleteRace(supabase),
    onSuccess: () => qc.invalidateQueries({ queryKey: programsKeys.all }),
  });
}

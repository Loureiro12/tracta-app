import { toDateKey } from '@/shared/clock';

import { estimateMinutes, RACE_DISTANCES } from './workouts.helpers';

import type {
  ExerciseType,
  LibraryExercise,
  Race,
  Routine,
  RoutineExercise,
} from './workouts.types';
import type { exercises, programs, routines } from '@tracta/api';

const TYPE_BY_KIND: Record<exercises.ExerciseKind, ExerciseType> = {
  load_reps: 's',
  reps: 'b',
  time: 'c',
};
const KIND_BY_TYPE: Record<ExerciseType, exercises.ExerciseKind> = {
  s: 'load_reps',
  b: 'reps',
  c: 'time',
};

export function kindOf(type: ExerciseType): exercises.ExerciseKind {
  return KIND_BY_TYPE[type];
}

/** Backend exercise → the library entry the screens render. */
export function toLibraryExercise(e: exercises.Exercise): LibraryExercise {
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    group: e.muscleGroup,
    secondary: e.secondaryGroups,
    equipment: e.equipment,
    type: TYPE_BY_KIND[e.kind],
    kg: e.defaultKg,
    reps: e.defaultReps,
    rest: e.defaultRestSeconds,
    notes: e.instructions,
    personalNotes: e.notes,
    favorite: e.favorite,
    custom: e.custom,
  };
}

/** Favorites on top, the rest in the backend order (custom first, then the catalog). */
export function sortLibrary(list: LibraryExercise[]): LibraryExercise[] {
  return [...list.filter((e) => e.favorite), ...list.filter((e) => !e.favorite)];
}

function toRoutineExercise(e: routines.RoutineExercise): RoutineExercise {
  return {
    exerciseId: e.exerciseId,
    name: e.exercise.name,
    group: e.exercise.muscleGroup,
    equipment: e.exercise.equipment,
    sets: e.sets,
    reps: e.reps,
    kg: e.kg,
    rest: e.restSeconds,
    superset: e.superset,
    cardio: e.exercise.kind === 'time',
    prev: e.lastSets.map((s) => [s.kg, s.reps] as const),
  };
}

/** Backend routine → screen model (id is the uuid, `label` the visible letter). */
export function toRoutine(r: routines.Routine): Routine {
  const list = r.exercises.map(toRoutineExercise);
  return {
    id: r.id,
    label: r.label,
    name: r.name,
    focus: r.focus,
    day: r.weekday,
    estMinutes: estimateMinutes(list),
    lastDoneAt: r.lastDoneAt ? toDateKey(new Date(r.lastDoneAt)) : null,
    exercises: list,
  };
}

/** Builder exercises → save_routine payload rows. */
export function toRoutineInput(list: RoutineExercise[]): routines.RoutineInput['exercises'] {
  return list.map((e) => ({
    exerciseId: e.exerciseId,
    sets: e.sets,
    reps: e.reps,
    kg: e.kg,
    restSeconds: e.rest,
    superset: e.superset,
  }));
}

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Backend race → the editable race (weeks from `today`, keeping the exact saved date). */
export function toRace(r: programs.Race, today: string): Race {
  const km = r.distanceM / 1000;
  const preset = RACE_DISTANCES.find((d) => Math.round(d.km * 1000) === r.distanceM);
  return {
    distance: preset?.distance ?? 10,
    km: preset?.km ?? km,
    weeks: Math.max(1, dayDiff(today, r.raceDate)) / 7,
    goal: r.targetSeconds,
  };
}

/** Editable race → backend input (date = today + the countdown). */
export function toRaceInput(race: Race, raceDate: Date): programs.RaceInput {
  return {
    distanceM: Math.round(race.km * 1000),
    raceDate: toDateKey(raceDate),
    targetSeconds: Math.min(86_400, Math.max(600, race.goal)),
  };
}

/** Routines (Treino A/B/C) and their prescribed exercises. */
import { z } from 'zod';

import { ApiError, unwrap, unwrapOne } from '../errors';

import type { TractaClient } from '../client';
import type { Json } from '../database.types';
import type { ExerciseKind, LoggedSet } from './exercises';

export type RoutineExercise = {
  id: string;
  exerciseId: string;
  /** Snapshot of the library entry, for display. */
  exercise: {
    slug: string;
    name: string;
    muscleGroup: string;
    equipment: string;
    kind: ExerciseKind;
  };
  position: number;
  sets: number;
  /** Reps, or minutes for time exercises. */
  reps: number;
  kg: number | null;
  restSeconds: number;
  /** Consecutive exercises sharing a key form a superset. */
  superset: string | null;
  /** Working sets of the last session that included this exercise ("anterior 60×8"). */
  lastSets: LoggedSet[];
};

export type Routine = {
  id: string;
  /** Short badge shown in the UI ("A"). */
  label: string;
  name: string;
  focus: string;
  /** 0 = Monday … 6 = Sunday; null = no fixed day. */
  weekday: number | null;
  position: number;
  /** When it was last performed (start of the latest session), or null. */
  lastDoneAt: string | null;
  exercises: RoutineExercise[];
};

const SELECT = `id, label, name, focus, weekday, position,
  routine_exercises (id, exercise_id, position, sets, reps, kg, rest_seconds, superset,
    exercises (slug, name, muscle_group, equipment, kind))`;

type RoutineSelect = {
  id: string;
  label: string;
  name: string;
  focus: string;
  weekday: number | null;
  position: number;
  routine_exercises: {
    id: string;
    exercise_id: string;
    position: number;
    sets: number;
    reps: number;
    kg: number | null;
    rest_seconds: number;
    superset: string | null;
    exercises: {
      slug: string;
      name: string;
      muscle_group: string;
      equipment: string;
      kind: ExerciseKind;
    } | null;
  }[];
};

async function requireUserId(client: TractaClient): Promise<string> {
  const { data } = await client.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ApiError('not_authenticated', 'Not signed in');
  return id;
}

function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  return parsed.data;
}

/** Adds last-session sets and last-done dates to the raw rows. */
async function hydrate(client: TractaClient, rows: RoutineSelect[]): Promise<Routine[]> {
  const exerciseIds = [
    ...new Set(rows.flatMap((r) => r.routine_exercises.map((e) => e.exercise_id))),
  ];
  const routineIds = rows.map((r) => r.id);
  const [last, sessions] = await Promise.all([
    exerciseIds.length
      ? client.rpc('last_sets', { exercise_ids: exerciseIds })
      : Promise.resolve({ data: [], error: null }),
    routineIds.length
      ? client
          .from('workout_sessions')
          .select('routine_id, started_at')
          .in('routine_id', routineIds)
          .order('started_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const lastByExercise = new Map<string, LoggedSet[]>();
  for (const s of unwrap(last) ?? []) {
    const list = lastByExercise.get(s.exercise_id) ?? [];
    list.push({ kg: s.kg ?? null, reps: s.reps });
    lastByExercise.set(s.exercise_id, list);
  }
  const lastDone = new Map<string, string>();
  for (const s of unwrap(sessions) ?? [])
    if (s.routine_id && !lastDone.has(s.routine_id)) lastDone.set(s.routine_id, s.started_at);

  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    name: r.name,
    focus: r.focus,
    weekday: r.weekday,
    position: r.position,
    lastDoneAt: lastDone.get(r.id) ?? null,
    exercises: [...r.routine_exercises]
      .sort((a, b) => a.position - b.position)
      .map((e) => ({
        id: e.id,
        exerciseId: e.exercise_id,
        exercise: {
          slug: e.exercises?.slug ?? '',
          name: e.exercises?.name ?? '',
          muscleGroup: e.exercises?.muscle_group ?? '',
          equipment: e.exercises?.equipment ?? '',
          kind: e.exercises?.kind ?? 'load_reps',
        },
        position: e.position,
        sets: e.sets,
        reps: e.reps,
        kg: e.kg,
        restSeconds: e.rest_seconds,
        superset: e.superset,
        lastSets: lastByExercise.get(e.exercise_id) ?? [],
      })),
  }));
}

/** The user's routines in display order, with exercises, last sets and last-done dates. */
export async function listRoutines(client: TractaClient): Promise<Routine[]> {
  await requireUserId(client);
  const rows = unwrap(
    await client
      .from('routines')
      .select(SELECT)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
  ) as unknown as RoutineSelect[];
  return hydrate(client, rows);
}

export async function getRoutine(client: TractaClient, id: string): Promise<Routine> {
  await requireUserId(client);
  const routineId = parse(z.guid(), id);
  const row = unwrapOne(
    await client.from('routines').select(SELECT).eq('id', routineId).maybeSingle(),
    'routine',
  ) as unknown as RoutineSelect;
  const [routine] = await hydrate(client, [row]);
  if (!routine) throw new ApiError('not_found', 'routine not found');
  return routine;
}

export const routineExerciseInput = z.object({
  exerciseId: z.guid(),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(600),
  kg: z.number().min(0).max(9999).nullable().default(null),
  restSeconds: z.number().int().min(0).max(900).default(90),
  superset: z.string().trim().min(1).max(8).nullable().default(null),
});

export const routineInput = z.object({
  /** Existing routine to update; omit to create. */
  id: z.guid().optional(),
  /** Badge ("D"); on create defaults to the first free letter. */
  label: z.string().trim().min(1).max(2).optional(),
  name: z.string().trim().min(1).max(40),
  focus: z.string().trim().max(60).default(''),
  weekday: z.number().int().min(0).max(6).nullable().default(null),
  exercises: z.array(routineExerciseInput).min(1).max(40),
});

export type RoutineInput = z.input<typeof routineInput>;

/** Creates or updates a routine and replaces its exercises atomically (RPC save_routine). */
export async function saveRoutine(client: TractaClient, input: RoutineInput): Promise<Routine> {
  await requireUserId(client);
  const data = parse(routineInput, input);
  const payload = {
    id: data.id ?? null,
    label: data.label ?? null,
    name: data.name,
    focus: data.focus,
    weekday: data.weekday,
    exercises: data.exercises,
  } satisfies Json;
  // Unknown or someone else's exercise ids fail the RLS check → `forbidden`.
  const id = unwrapOne(await client.rpc('save_routine', { payload }), 'routine');
  return getRoutine(client, id);
}

/** First free badge letter A..Z (what save_routine assigns when no label is given). */
export function nextLabel(taken: Iterable<string>): string | null {
  const used = new Set(taken);
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!used.has(letter)) return letter;
  return null;
}

/**
 * Copies a routine under the next free label, without a fixed day. `name` builds the copy's
 * name from its label (defaults to the source name).
 */
export async function duplicateRoutine(
  client: TractaClient,
  id: string,
  options: { name?: (label: string) => string } = {},
): Promise<Routine> {
  await requireUserId(client);
  const [source, labels] = await Promise.all([
    getRoutine(client, id),
    client.from('routines').select('label'),
  ]);
  const label = nextLabel((unwrap(labels) ?? []).map((r) => r.label));
  if (!label) throw new ApiError('conflict', 'No free routine label');
  return saveRoutine(client, {
    label,
    name: (options.name?.(label) ?? source.name).slice(0, 40),
    focus: source.focus,
    weekday: null,
    exercises: source.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets,
      reps: e.reps,
      kg: e.kg,
      restSeconds: e.restSeconds,
      superset: e.superset,
    })),
  });
}

/** Deletes a routine (its exercises cascade; past sessions keep their snapshot title). */
export async function deleteRoutine(client: TractaClient, id: string): Promise<void> {
  await requireUserId(client);
  const routineId = parse(z.guid(), id);
  const rows = unwrap(await client.from('routines').delete().eq('id', routineId).select('id'));
  if (!rows?.length) throw new ApiError('not_found', 'routine not found');
}

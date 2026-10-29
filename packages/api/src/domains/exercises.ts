/** Exercise library (built-in + custom), favorites and notes. */
import { z } from 'zod';

import { ApiError, toApiError, unwrap, unwrapOne } from '../errors';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];
type PrefRow = Database['public']['Tables']['exercise_prefs']['Row'];

/** How an exercise is logged: load × reps, reps only (bodyweight) or time (minutes). */
export type ExerciseKind = Database['public']['Enums']['exercise_kind'];

export type Exercise = {
  id: string;
  /** Stable URL-safe key ("supino-reto-com-barra"), unique per owner. */
  slug: string;
  name: string;
  muscleGroup: string;
  secondaryGroups: string[];
  equipment: string;
  kind: ExerciseKind;
  /** Default load in kg (null for bodyweight/time). */
  defaultKg: number | null;
  /** Default reps, or minutes when kind = 'time'. */
  defaultReps: number;
  defaultRestSeconds: number;
  /** Execution cues (custom exercises: the notes typed when registering it). */
  instructions: string;
  /** Registered by the user (editable/deletable); false for the built-in library. */
  custom: boolean;
  /** Per-user preferences. */
  favorite: boolean;
  notes: string;
};

/** A working set, as returned by the last session and the personal record. */
export type LoggedSet = { kg: number | null; reps: number };

export type ExerciseHistory = {
  /** Working sets of the most recent session with this exercise (in order). */
  lastSets: LoggedSet[];
  lastPerformedAt: string | null;
  /** Heaviest set (then most reps) ever logged. */
  best: LoggedSet | null;
  /** Number of sessions that included this exercise. */
  sessions: number;
};

const COLUMNS =
  'id, owner_id, slug, name, muscle_group, secondary_groups, equipment, kind, default_kg, default_reps, default_rest_seconds, instructions, position, created_at';

type ExerciseSelect = Pick<
  ExerciseRow,
  | 'id'
  | 'owner_id'
  | 'slug'
  | 'name'
  | 'muscle_group'
  | 'secondary_groups'
  | 'equipment'
  | 'kind'
  | 'default_kg'
  | 'default_reps'
  | 'default_rest_seconds'
  | 'instructions'
  | 'position'
  | 'created_at'
>;

function toExercise(r: ExerciseSelect, pref?: Pick<PrefRow, 'favorite' | 'notes'>): Exercise {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    muscleGroup: r.muscle_group,
    secondaryGroups: r.secondary_groups,
    equipment: r.equipment,
    kind: r.kind,
    defaultKg: r.default_kg,
    defaultReps: r.default_reps,
    defaultRestSeconds: r.default_rest_seconds,
    instructions: r.instructions,
    custom: r.owner_id !== null,
    favorite: pref?.favorite ?? false,
    notes: pref?.notes ?? '',
  };
}

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

const uuid = z.guid();

/** Stable, URL-safe slug from a name ("Leg press 45°" → "leg-press-45"). */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Library visible to the user: own custom exercises first (newest first), then the built-in
 * catalog in its curated order. Favorites/notes are merged in.
 */
export async function listExercises(client: TractaClient): Promise<Exercise[]> {
  const me = await requireUserId(client);
  const [rows, prefs] = await Promise.all([
    client
      .from('exercises')
      .select(COLUMNS)
      .order('owner_id', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('position', { ascending: true })
      .order('name', { ascending: true }),
    client.from('exercise_prefs').select('exercise_id, favorite, notes').eq('user_id', me),
  ]);
  const byId = new Map((unwrap(prefs) ?? []).map((p) => [p.exercise_id, p]));
  const list = (unwrap(rows) ?? []).map((r) => toExercise(r, byId.get(r.id)));
  // Custom first (any owner_id is the caller under RLS), then built-ins.
  return [...list.filter((e) => e.custom), ...list.filter((e) => !e.custom)];
}

export async function getExercise(client: TractaClient, id: string): Promise<Exercise> {
  const me = await requireUserId(client);
  const exerciseId = parse(uuid, id);
  const [row, pref] = await Promise.all([
    client.from('exercises').select(COLUMNS).eq('id', exerciseId).maybeSingle(),
    client
      .from('exercise_prefs')
      .select('favorite, notes')
      .eq('user_id', me)
      .eq('exercise_id', exerciseId)
      .maybeSingle(),
  ]);
  return toExercise(unwrapOne(row, 'exercise'), unwrap(pref) ?? undefined);
}

export const exerciseInput = z
  .object({
    name: z.string().trim().min(2).max(60),
    muscleGroup: z.string().trim().min(1).max(40),
    secondaryGroups: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    equipment: z.string().trim().min(1).max(40).default('Outro'),
    kind: z.enum(['load_reps', 'reps', 'time']).default('load_reps'),
    defaultKg: z.number().min(0).max(9999).nullable().default(null),
    defaultReps: z.number().int().min(1).max(600).default(10),
    defaultRestSeconds: z.number().int().min(0).max(900).default(90),
    instructions: z.string().trim().max(500).default(''),
    favorite: z.boolean().optional(),
  })
  .refine((v) => slugify(v.name).length > 0, { message: 'Name needs letters or digits' });

export type ExerciseInput = z.input<typeof exerciseInput>;

function toRow(e: z.output<typeof exerciseInput>) {
  return {
    slug: slugify(e.name),
    name: e.name,
    muscle_group: e.muscleGroup,
    secondary_groups: e.secondaryGroups.filter((g) => g !== e.muscleGroup),
    equipment: e.equipment,
    kind: e.kind,
    default_kg: e.kind === 'load_reps' ? e.defaultKg : null,
    default_reps: e.defaultReps,
    default_rest_seconds: e.kind === 'time' ? 0 : e.defaultRestSeconds,
    instructions: e.instructions,
  };
}

/** Registers a custom exercise. A name whose slug the user already has fails with `conflict`. */
export async function createExercise(
  client: TractaClient,
  input: ExerciseInput,
): Promise<Exercise> {
  const me = await requireUserId(client);
  const data = parse(exerciseInput, input);
  const row = unwrapOne(
    await client
      .from('exercises')
      .insert({ ...toRow(data), owner_id: me })
      .select(COLUMNS)
      .maybeSingle(),
    'exercise',
  );
  if (data.favorite) await setFavorite(client, row.id, true);
  return toExercise(row, { favorite: data.favorite ?? false, notes: '' });
}

/** Edits a custom exercise (built-ins and other users' exercises fail with `not_found`). */
export async function updateExercise(
  client: TractaClient,
  id: string,
  input: ExerciseInput,
): Promise<Exercise> {
  await requireUserId(client);
  const exerciseId = parse(uuid, id);
  const data = parse(exerciseInput, input);
  unwrapOne(
    await client
      .from('exercises')
      .update(toRow(data))
      .eq('id', exerciseId)
      .not('owner_id', 'is', null)
      .select('id')
      .maybeSingle(),
    'exercise',
  );
  if (data.favorite !== undefined) await setFavorite(client, exerciseId, data.favorite);
  return getExercise(client, exerciseId);
}

/**
 * Deletes a custom exercise. Fails with `not_found` for built-ins/others and with `conflict`
 * while a routine or a logged session still uses it.
 */
export async function deleteExercise(client: TractaClient, id: string): Promise<void> {
  await requireUserId(client);
  const exerciseId = parse(uuid, id);
  const { data, error } = await client
    .from('exercises')
    .delete()
    .eq('id', exerciseId)
    .not('owner_id', 'is', null)
    .select('id');
  if (error) {
    if ((error as { code?: string }).code === '23503')
      throw new ApiError('conflict', 'Exercise is used by a routine or a session', error);
    throw toApiError(error);
  }
  if (!data.length) throw new ApiError('not_found', 'exercise not found');
}

async function upsertPref(
  client: TractaClient,
  id: string,
  patch: { favorite?: boolean; notes?: string },
): Promise<void> {
  const me = await requireUserId(client);
  const exerciseId = parse(uuid, id);
  const current = unwrap(
    await client
      .from('exercise_prefs')
      .select('favorite, notes')
      .eq('user_id', me)
      .eq('exercise_id', exerciseId)
      .maybeSingle(),
  );
  unwrap(
    await client.from('exercise_prefs').upsert({
      user_id: me,
      exercise_id: exerciseId,
      favorite: patch.favorite ?? current?.favorite ?? false,
      notes: patch.notes ?? current?.notes ?? '',
    }),
  );
}

export async function setFavorite(
  client: TractaClient,
  id: string,
  favorite: boolean,
): Promise<void> {
  await upsertPref(client, id, { favorite: parse(z.boolean(), favorite) });
}

/** Private notes on any visible exercise (≤ 500 characters). */
export async function setNotes(client: TractaClient, id: string, notes: string): Promise<void> {
  await upsertPref(client, id, { notes: parse(z.string().max(500), notes) });
}

/** The user's logged history of one exercise: last session sets, best set and session count. */
export async function getExerciseHistory(
  client: TractaClient,
  id: string,
): Promise<ExerciseHistory> {
  const me = await requireUserId(client);
  const exerciseId = parse(uuid, id);
  const [last, best, sets] = await Promise.all([
    client.rpc('last_sets', { exercise_ids: [exerciseId] }),
    client
      .from('personal_records')
      .select('kg, reps')
      .eq('owner_id', me)
      .eq('exercise_id', exerciseId)
      .maybeSingle(),
    client
      .from('session_sets')
      .select('session_id')
      .eq('exercise_id', exerciseId)
      .eq('is_warmup', false),
  ]);
  const lastRows = unwrap(last) ?? [];
  const record = unwrap(best);
  return {
    lastSets: lastRows.map((s) => ({ kg: s.kg, reps: s.reps })),
    lastPerformedAt: lastRows[0]?.performed_at ?? null,
    best: record && record.reps !== null ? { kg: record.kg, reps: record.reps } : null,
    sessions: new Set((unwrap(sets) ?? []).map((s) => s.session_id)).size,
  };
}

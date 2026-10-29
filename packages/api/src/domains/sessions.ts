/** Strength sessions: save, list, detail, delete, notes, last sets, personal records. */
import { z } from 'zod';

import { ApiError, unwrap, unwrapOne } from '../errors';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';

type SetRow = Database['public']['Tables']['session_sets']['Row'];

/** Any 8-4-4-4-12 hex id (seeded ids are not RFC-versioned). */
export const idSchema = z.guid();

export async function requireUser(client: TractaClient): Promise<string> {
  const { data } = await client.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ApiError('not_authenticated', 'Not signed in');
  return id;
}

export function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  return parsed.data;
}

/** Half-open ISO instant range [from, to) used by every list read. */
export const rangeInput = z
  .object({ from: z.iso.datetime({ offset: true }), to: z.iso.datetime({ offset: true }) })
  .refine((r) => Date.parse(r.from) < Date.parse(r.to), { message: '`from` must be before `to`' });
export type Range = z.input<typeof rangeInput>;

/** List response: throws mapped errors, never returns null. */
export function listOf<T>(result: { data: T[] | null; error: unknown }): T[] {
  return unwrap(result) ?? [];
}

const num = (v: number | string | null): number | null => (v === null ? null : Number(v));

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export const sessionSetInput = z.object({
  exerciseId: idSchema,
  exercisePosition: z.number().int().min(0).max(200),
  setIndex: z.number().int().min(0).max(100),
  kg: z.number().min(0).max(1000).nullable(),
  reps: z.number().int().min(0).max(600),
  isWarmup: z.boolean().optional(),
  superset: z.string().max(8).nullable().optional(),
});

export const saveSessionInput = z
  .object({
    routineId: idSchema.nullable().optional(),
    title: z.string().trim().min(1).max(60),
    focus: z.string().max(60).optional(),
    startedAt: z.iso.datetime({ offset: true }),
    endedAt: z.iso.datetime({ offset: true }),
    pausedSeconds: z.number().int().min(0).optional(),
    notes: z.string().max(1000).optional(),
    sets: z.array(sessionSetInput).max(500),
  })
  .refine((s) => Date.parse(s.endedAt) >= Date.parse(s.startedAt), {
    message: 'endedAt must not be before startedAt',
  });

export type SaveSessionInput = z.input<typeof saveSessionInput>;

/** Saves a finished session and all its sets atomically; returns the new session id. */
export async function saveSession(client: TractaClient, input: SaveSessionInput): Promise<string> {
  await requireUser(client);
  const payload = parse(saveSessionInput, input);
  return unwrapOne(await client.rpc('save_workout_session', { payload }), 'session');
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type SessionListItem = {
  id: string;
  routineId: string | null;
  title: string;
  focus: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  sets: number;
  reps: number;
  volumeKg: number;
};

const durationOf = (startedAt: string, endedAt: string, paused: number) =>
  Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000) - paused);

/** Sessions that started inside [from, to), oldest first, with their totals. */
export async function listSessions(client: TractaClient, range: Range): Promise<SessionListItem[]> {
  await requireUser(client);
  const r = parse(rangeInput, range);
  const rows = listOf(
    await client
      .from('workout_sessions')
      .select(
        'id, routine_id, title, focus, started_at, ended_at, paused_seconds, session_sets(kg, reps, is_warmup)',
      )
      .gte('started_at', r.from)
      .lt('started_at', r.to)
      .order('started_at'),
  );
  return rows.map((s) => {
    const working = s.session_sets.filter((x) => !x.is_warmup);
    return {
      id: s.id,
      routineId: s.routine_id,
      title: s.title,
      focus: s.focus,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationSeconds: durationOf(s.started_at, s.ended_at, s.paused_seconds),
      sets: working.length,
      reps: working.reduce((a, x) => a + x.reps, 0),
      volumeKg: working.reduce((a, x) => a + (x.kg === null ? 0 : Number(x.kg) * x.reps), 0),
    };
  });
}

export type LoggedSet = { setIndex: number; kg: number | null; reps: number; isWarmup: boolean };

export type SessionExercise = {
  exerciseId: string;
  slug: string;
  name: string;
  /** Logged as reps only (no load). */
  bodyweight: boolean;
  position: number;
  superset: string | null;
  /** This session holds the user's all-time record for the exercise. */
  pr: boolean;
  sets: LoggedSet[];
};

export type SessionDetail = SessionListItem & {
  pausedSeconds: number;
  notes: string;
  exercises: SessionExercise[];
};

/** Full session with sets grouped per exercise (in session order); null when missing or not visible. */
export async function getSession(client: TractaClient, id: string): Promise<SessionDetail | null> {
  await requireUser(client);
  if (!idSchema.safeParse(id).success) return null;
  const [sessionRes, prRes] = await Promise.all([
    client
      .from('workout_sessions')
      .select('*, session_sets(*, exercises(id, slug, name, kind))')
      .eq('id', id)
      .maybeSingle(),
    client.from('personal_records').select('exercise_id').eq('session_id', id),
  ]);
  const s = unwrap(sessionRes);
  if (!s) return null;
  const prs = new Set(listOf(prRes).map((r) => r.exercise_id));
  const byPosition = new Map<number, SessionExercise>();
  const sorted = [...s.session_sets].sort(
    (a, b) =>
      a.exercise_position - b.exercise_position ||
      Number(b.is_warmup) - Number(a.is_warmup) ||
      a.set_index - b.set_index,
  );
  for (const set of sorted) {
    const ex = set.exercises;
    let entry = byPosition.get(set.exercise_position);
    if (!entry) {
      entry = {
        exerciseId: set.exercise_id,
        slug: ex?.slug ?? '',
        name: ex?.name ?? '',
        bodyweight: ex?.kind === 'reps',
        position: set.exercise_position,
        superset: set.superset,
        pr: prs.has(set.exercise_id),
        sets: [],
      };
      byPosition.set(set.exercise_position, entry);
    }
    entry.sets.push({
      setIndex: set.set_index,
      kg: num(set.kg),
      reps: set.reps,
      isWarmup: set.is_warmup,
    });
  }
  const working = s.session_sets.filter((x: SetRow) => !x.is_warmup);
  return {
    id: s.id,
    routineId: s.routine_id,
    title: s.title,
    focus: s.focus,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    pausedSeconds: s.paused_seconds,
    notes: s.notes,
    durationSeconds: durationOf(s.started_at, s.ended_at, s.paused_seconds),
    sets: working.length,
    reps: working.reduce((a, x) => a + x.reps, 0),
    volumeKg: working.reduce((a, x) => a + (x.kg === null ? 0 : Number(x.kg) * x.reps), 0),
    exercises: [...byPosition.values()],
  };
}

/** Deletes a session (its sets cascade). not_found when it does not exist or is not the caller's. */
export async function deleteSession(client: TractaClient, id: string): Promise<void> {
  await requireUser(client);
  parse(idSchema, id);
  const rows = listOf(await client.from('workout_sessions').delete().eq('id', id).select('id'));
  if (rows.length === 0) throw new ApiError('not_found', 'session not found');
}

export const notesInput = z.string().max(1000);

export async function updateSessionNotes(
  client: TractaClient,
  id: string,
  notes: string,
): Promise<void> {
  await requireUser(client);
  parse(idSchema, id);
  const value = parse(notesInput, notes);
  const rows = listOf(
    await client.from('workout_sessions').update({ notes: value }).eq('id', id).select('id'),
  );
  if (rows.length === 0) throw new ApiError('not_found', 'session not found');
}

export type PreviousSet = {
  setIndex: number;
  kg: number | null;
  reps: number;
  performedAt: string;
};

/** Working sets of the latest session that included each exercise ("anterior 60 × 8"). */
export async function lastSets(
  client: TractaClient,
  exerciseIds: readonly string[],
): Promise<Record<string, PreviousSet[]>> {
  await requireUser(client);
  const ids = parse(z.array(idSchema).max(200), exerciseIds);
  const out: Record<string, PreviousSet[]> = {};
  if (ids.length === 0) return out;
  const rows = listOf(await client.rpc('last_sets', { exercise_ids: ids }));
  for (const r of rows) {
    (out[r.exercise_id] ??= []).push({
      setIndex: r.set_index,
      kg: num(r.kg),
      reps: r.reps,
      performedAt: r.performed_at,
    });
  }
  return out;
}

export type PersonalRecord = {
  exerciseId: string;
  slug: string;
  name: string;
  kg: number | null;
  reps: number;
  sessionId: string;
  achievedAt: string;
};

/** Best working set per exercise (heaviest load, then most reps; earliest wins ties). */
export async function listPersonalRecords(client: TractaClient): Promise<PersonalRecord[]> {
  await requireUser(client);
  const rows = listOf(
    await client.from('personal_records').select('exercise_id, kg, reps, session_id, achieved_at'),
  );
  const ids = [...new Set(rows.map((r) => r.exercise_id).filter((x): x is string => !!x))];
  const names = new Map<string, { slug: string; name: string }>();
  if (ids.length) {
    for (const e of listOf(await client.from('exercises').select('id, slug, name').in('id', ids)))
      names.set(e.id, { slug: e.slug, name: e.name });
  }
  return rows
    .filter((r) => r.exercise_id && r.session_id && r.achieved_at && r.reps !== null)
    .map((r) => ({
      exerciseId: r.exercise_id!,
      slug: names.get(r.exercise_id!)?.slug ?? '',
      name: names.get(r.exercise_id!)?.name ?? '',
      kg: num(r.kg),
      reps: r.reps!,
      sessionId: r.session_id!,
      achievedAt: r.achieved_at!,
    }));
}

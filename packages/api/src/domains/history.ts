/** History reads: month calendar, entry detail, evolution series and records. */
import { z } from 'zod';

import { getActivity } from './activities';
import { getSession, idSchema, parse, rangeInput, listOf, requireUser } from './sessions';

import type { Activity, ActivityKind } from './activities';
import type { Range, SessionDetail } from './sessions';
import type { TractaClient } from '../client';

export type EntryKind = 'strength' | ActivityKind;

/** One logged strength session or activity. */
export type HistoryEntry = {
  id: string;
  kind: EntryKind;
  startedAt: string;
  durationSeconds: number;
  /** Strength: routine name snapshot ("Treino A") and focus. */
  title: string | null;
  focus: string | null;
  routineId: string | null;
  sets: number | null;
  volumeKg: number | null;
  distanceM: number | null;
  avgHeartRate: number | null;
};

export type PlannedRoutine = {
  id: string;
  label: string;
  name: string;
  focus: string;
  /** 0 = Monday … 6 = Sunday, null when not scheduled. */
  weekday: number | null;
};

export type MonthTotals = { workouts: number; runKm: number; volumeKg: number };

export type MonthView = {
  entries: HistoryEntry[];
  totals: MonthTotals;
  routines: PlannedRoutine[];
};

/** Entries of [from, to) (the app passes its local month bounds) with totals and the routine plan. */
export async function getMonth(client: TractaClient, range: Range): Promise<MonthView> {
  await requireUser(client);
  const r = parse(rangeInput, range);
  const [entriesRes, routinesRes] = await Promise.all([
    client
      .from('history_entries')
      .select('*')
      .gte('started_at', r.from)
      .lt('started_at', r.to)
      .order('started_at'),
    client.from('routines').select('id, label, name, focus, weekday').order('position'),
  ]);
  const entries: HistoryEntry[] = listOf(entriesRes).map((e) => ({
    id: e.id!,
    kind: e.kind as EntryKind,
    startedAt: e.started_at!,
    durationSeconds: e.duration_seconds ?? 0,
    title: e.title,
    focus: e.focus,
    routineId: e.routine_id,
    sets: e.sets,
    volumeKg: e.volume_kg === null ? null : Number(e.volume_kg),
    distanceM: e.distance_m,
    avgHeartRate: e.avg_heart_rate,
  }));
  const totals: MonthTotals = {
    workouts: entries.length,
    runKm: entries.reduce((a, e) => a + (e.kind === 'run' ? (e.distanceM ?? 0) / 1000 : 0), 0),
    volumeKg: entries.reduce((a, e) => a + (e.volumeKg ?? 0), 0),
  };
  return { entries, totals, routines: listOf(routinesRes) };
}

export type EntryDetail =
  { kind: 'strength'; session: SessionDetail } | { kind: 'activity'; activity: Activity };

/** Session or activity by id; null for unknown ids (including malformed ones). */
export async function getEntryDetail(
  client: TractaClient,
  id: string,
): Promise<EntryDetail | null> {
  await requireUser(client);
  if (!idSchema.safeParse(id).success) return null;
  const [session, activity] = await Promise.all([getSession(client, id), getActivity(client, id)]);
  if (session) return { kind: 'strength', session };
  if (activity) return { kind: 'activity', activity };
  return null;
}

// ---------------------------------------------------------------------------
// Evolution
// ---------------------------------------------------------------------------

export type StrengthPoint = {
  sessionId: string;
  startedAt: string;
  /** Heaviest working set (null for bodyweight exercises) and its reps. */
  topKg: number | null;
  topReps: number;
  maxReps: number;
  totalReps: number;
  /** Σ kg × reps of the working sets (0 for bodyweight). */
  volumeKg: number;
};

export type ExerciseEvolution = {
  exerciseId: string;
  slug: string;
  name: string;
  bodyweight: boolean;
  /** Oldest first. */
  points: StrengthPoint[];
};

export type RunPoint = {
  id: string;
  startedAt: string;
  distanceKm: number;
  durationSeconds: number;
  paceSeconds: number;
  avgHeartRate: number | null;
  gps: boolean;
};

export type Evolution = { exercises: ExerciseEvolution[]; runs: RunPoint[] };

export const evolutionInput = z.object({ from: z.iso.datetime({ offset: true }) });

/**
 * Per-exercise series (one point per session) and runs since `from`. Exercises are ordered like
 * the routines they were trained in (session title, then position in the session).
 */
export async function getEvolution(
  client: TractaClient,
  input: z.input<typeof evolutionInput>,
): Promise<Evolution> {
  await requireUser(client);
  const { from } = parse(evolutionInput, input);
  const [setsRes, runsRes] = await Promise.all([
    client
      .from('session_sets')
      .select(
        'kg, reps, exercise_position, session_id, workout_sessions!inner(started_at, title), exercises!inner(id, slug, name, kind)',
      )
      .eq('is_warmup', false)
      .gte('workout_sessions.started_at', from),
    client
      .from('activities')
      .select('id, started_at, duration_seconds, distance_m, avg_heart_rate, gps')
      .eq('kind', 'run')
      .gte('started_at', from)
      .order('started_at'),
  ]);
  type Acc = ExerciseEvolution & {
    order: [string, string, number];
    bySession: Map<string, StrengthPoint>;
  };
  const byExercise = new Map<string, Acc>();
  for (const s of listOf(setsRes)) {
    const ex = s.exercises;
    const session = s.workout_sessions;
    let acc = byExercise.get(ex.id);
    if (!acc) {
      acc = {
        exerciseId: ex.id,
        slug: ex.slug,
        name: ex.name,
        bodyweight: ex.kind === 'reps',
        points: [],
        order: ['', session.title, s.exercise_position],
        bySession: new Map(),
      };
      byExercise.set(ex.id, acc);
    }
    // order by the latest session that trained it
    if (session.started_at > acc.order[0])
      acc.order = [session.started_at, session.title, s.exercise_position];
    let p = acc.bySession.get(s.session_id);
    if (!p) {
      p = {
        sessionId: s.session_id,
        startedAt: session.started_at,
        topKg: null,
        topReps: 0,
        maxReps: 0,
        totalReps: 0,
        volumeKg: 0,
      };
      acc.bySession.set(s.session_id, p);
    }
    const kg = s.kg === null ? null : Number(s.kg);
    if (
      kg !== null &&
      (p.topKg === null || kg > p.topKg || (kg === p.topKg && s.reps > p.topReps))
    ) {
      p.topKg = kg;
      p.topReps = s.reps;
    }
    p.maxReps = Math.max(p.maxReps, s.reps);
    p.totalReps += s.reps;
    p.volumeKg += kg === null ? 0 : kg * s.reps;
  }
  const exercises = [...byExercise.values()]
    .sort(
      (a, b) =>
        a.order[1].localeCompare(b.order[1]) ||
        a.order[2] - b.order[2] ||
        a.name.localeCompare(b.name),
    )
    .map(({ exerciseId, slug, name, bodyweight, bySession }) => ({
      exerciseId,
      slug,
      name,
      bodyweight,
      points: [...bySession.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    }));
  const runs = listOf(runsRes)
    .filter((r) => (r.distance_m ?? 0) > 0)
    .map((r) => ({
      id: r.id,
      startedAt: r.started_at,
      distanceKm: (r.distance_m ?? 0) / 1000,
      durationSeconds: r.duration_seconds,
      paceSeconds: r.duration_seconds / ((r.distance_m ?? 1) / 1000),
      avgHeartRate: r.avg_heart_rate,
      gps: r.gps,
    }));
  return { exercises, runs };
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export type StrengthBest = {
  kg: number | null;
  reps: number;
  sessionId: string;
  achievedAt: string;
};

export type StrengthRecord = {
  slug: string;
  bodyweight: boolean;
  best: StrengthBest | null;
  /** Best before the record was set (null when the record was the first time). */
  previous: StrengthBest | null;
};

export type RunBest = { value: number; activityId: string; achievedAt: string };

export type RunRecord = { best: RunBest | null; previous: RunBest | null };

export type Records = {
  strength: StrengthRecord[];
  run: {
    /** Seconds of the fastest full kilometre split. */
    best1k: RunRecord;
    /** Seconds of the fastest 5 / 10 consecutive full splits (also inside longer runs). */
    fiveK: RunRecord;
    tenK: RunRecord;
    /** Metres of the longest run. */
    longest: RunRecord;
  };
};

export const recordsInput = z.object({
  /** Library exercises to report, in display order. */
  exerciseSlugs: z.array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)).max(20),
});

/** true when `a` beats `b` (heavier, then more reps; bodyweight compares reps). */
function better(a: { kg: number | null; reps: number }, b: { kg: number | null; reps: number }) {
  const ak = a.kg ?? 0;
  const bk = b.kg ?? 0;
  return ak > bk || (ak === bk && a.reps > b.reps);
}

function recordOf<T extends { achievedAt: string }>(
  candidates: T[],
  beats: (a: T, b: T) => boolean,
): { best: T | null; previous: T | null } {
  const sorted = [...candidates].sort((a, b) => a.achievedAt.localeCompare(b.achievedAt));
  let best: T | null = null;
  let previous: T | null = null;
  for (const c of sorted) {
    if (!best || beats(c, best)) {
      previous = best;
      best = c;
    }
  }
  return { best, previous };
}

/** Fastest window of `size` consecutive full splits, in seconds (null when the run is shorter). */
function bestWindow(splits: { km: number; seconds: number }[], size: number): number | null {
  const full = splits.filter((s) => s.km >= 1).map((s) => s.seconds);
  if (full.length < size) return null;
  let sum = full.slice(0, size).reduce((a, b) => a + b, 0);
  let best = sum;
  for (let i = size; i < full.length; i++) {
    sum += full[i]! - full[i - size]!;
    best = Math.min(best, sum);
  }
  return best;
}

/** Strength records for the given exercises and running records over every logged run. */
export async function getRecords(
  client: TractaClient,
  input: z.input<typeof recordsInput>,
): Promise<Records> {
  await requireUser(client);
  const { exerciseSlugs } = parse(recordsInput, input);
  const [setsRes, runsRes] = await Promise.all([
    exerciseSlugs.length
      ? client
          .from('session_sets')
          .select(
            'kg, reps, session_id, workout_sessions!inner(started_at), exercises!inner(slug, kind, owner_id)',
          )
          .eq('is_warmup', false)
          .gt('reps', 0)
          .is('exercises.owner_id', null)
          .in('exercises.slug', exerciseSlugs)
      : Promise.resolve({ data: [], error: null }),
    client
      .from('activities')
      .select('id, started_at, distance_m, splits')
      .eq('kind', 'run')
      .order('started_at'),
  ]);

  const perSlug = new Map<string, { bodyweight: boolean; sessions: Map<string, StrengthBest> }>();
  for (const s of listOf(setsRes)) {
    const slug = s.exercises.slug;
    const acc = perSlug.get(slug) ?? {
      bodyweight: s.exercises.kind === 'reps',
      sessions: new Map(),
    };
    perSlug.set(slug, acc);
    const candidate: StrengthBest = {
      kg: s.kg === null ? null : Number(s.kg),
      reps: s.reps,
      sessionId: s.session_id,
      achievedAt: s.workout_sessions.started_at,
    };
    const current = acc.sessions.get(s.session_id);
    if (!current || better(candidate, current)) acc.sessions.set(s.session_id, candidate);
  }
  const strength = exerciseSlugs.map((slug) => {
    const acc = perSlug.get(slug);
    const { best, previous } = recordOf([...(acc?.sessions.values() ?? [])], better);
    return { slug, bodyweight: acc?.bodyweight ?? false, best, previous };
  });

  const runs = listOf(runsRes).map((r) => {
    const splits = z
      .array(z.object({ km: z.number(), seconds: z.number() }).loose())
      .catch([])
      .parse(r.splits);
    return { id: r.id, at: r.started_at, distance: r.distance_m ?? 0, splits };
  });
  const runRecord = (
    value: (run: (typeof runs)[number]) => number | null,
    higherIsBetter = false,
  ): RunRecord => {
    const candidates: RunBest[] = [];
    for (const run of runs) {
      const v = value(run);
      if (v !== null && v > 0)
        candidates.push({ value: v, activityId: run.id, achievedAt: run.at });
    }
    return recordOf(candidates, (a, b) => (higherIsBetter ? a.value > b.value : a.value < b.value));
  };
  return {
    strength,
    run: {
      best1k: runRecord((r) => bestWindow(r.splits, 1)),
      fiveK: runRecord((r) => bestWindow(r.splits, 5)),
      tenK: runRecord((r) => bestWindow(r.splits, 10)),
      longest: runRecord((r) => r.distance, true),
    },
  };
}

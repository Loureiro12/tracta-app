import { routines } from '@/features/workouts';

import type {
  ActiveSession,
  PlateBar,
  SessionExercise,
  SessionSet,
  SessionSummary,
} from './session.types';
import type { Routine } from '@/features/workouts';

/** Load increment for the kg stepper. */
export const KG_STEP = 2.5;
/** Smallest plate per side → total step for the plates calculator. */
export const PLATES_STEP = 2.5;
export const PLATE_BARS: readonly PlateBar[] = [20, 15, 10];
export const DEFAULT_ROUTINE_ID = 'A';
/** "Sessão livre": a session with no routine, built while training. */
export const FREE_ROUTINE_ID = 'FREE';

export function findRoutine(id: string | undefined): Routine {
  return routines.find((r) => r.id === id) ?? routines[0]!;
}

/** m:ss or h:mm:ss, like the prototype's `clock()`. */
export function clock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const sec = String(x).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function buildSession(routine: Routine, startedAt: number): ActiveSession {
  return {
    routineId: routine.id,
    name: routine.name,
    focus: routine.focus,
    startedAt,
    exerciseIndex: 0,
    elapsedSec: 0,
    paused: false,
    exercises: routine.exercises.map((e, i) => ({
      id: `${routine.id}-${i + 1}`,
      name: e.name,
      group: e.group,
      equipment: e.equipment,
      targetReps: e.reps,
      restSec: e.rest,
      superset: e.superset,
      bodyweight: e.kg == null,
      cardio: e.cardio,
      prev: e.prev,
      sets: Array.from({ length: e.sets }, (_, k) => ({
        kg: e.prev[k]?.[0] ?? e.kg,
        reps: e.reps,
        done: false,
      })),
      warmup: null,
      warmupSkipped: false,
      suggestionDismissed: false,
    })),
  };
}

/** Empty session for "Sessão livre" (name/focus are UI copy, resolved by the screen). */
export function buildFreeSession(startedAt: number): ActiveSession {
  return {
    routineId: FREE_ROUTINE_ID,
    name: '',
    focus: '',
    startedAt,
    exerciseIndex: 0,
    elapsedSec: 0,
    paused: false,
    exercises: [],
  };
}

export function activeSetIndex(exercise: SessionExercise): number {
  return exercise.sets.findIndex((s) => !s.done);
}

export function allSetsDone(session: ActiveSession): boolean {
  return (
    session.exercises.length > 0 && session.exercises.every((e) => e.sets.every((s) => s.done))
  );
}

export function countSets(session: ActiveSession): { done: number; total: number } {
  return session.exercises.reduce(
    (acc, e) => ({
      done: acc.done + e.sets.filter((s) => s.done).length,
      total: acc.total + e.sets.length,
    }),
    { done: 0, total: 0 },
  );
}

/** Progression step: dumbbells +2, legs/glutes +5, everything else +2.5. */
export function suggestionStep(exercise: SessionExercise): number {
  if (exercise.equipment === 'Halteres') return 2;
  if (exercise.group === 'Pernas' || exercise.group === 'Glúteos') return 5;
  return KG_STEP;
}

export type LoadSuggestion = { from: number; to: number; targetReps: number };

/** Offers a heavier load when every previous set hit the target reps (prototype `sugFor`). */
export function suggestionFor(exercise: SessionExercise): LoadSuggestion | null {
  const { sets, prev, targetReps } = exercise;
  if (!sets.length || exercise.bodyweight || exercise.cardio || exercise.suggestionDismissed)
    return null;
  if (!targetReps || !prev.length || sets.some((s) => s.done)) return null;
  if (!prev.every((p) => p[1] >= targetReps)) return null;
  const from = Math.max(...prev.map((p) => p[0] ?? 0));
  const to = Math.round((from + suggestionStep(exercise)) * 100) / 100;
  if (sets.every((s) => (s.kg ?? 0) >= to)) return null;
  return { from, to, targetReps };
}

/** 40/60/80 % warm-up sets rounded to 2.5 kg, never below the bar (prototype `warmSets`). */
export function warmupSets(kg: number): SessionSet[] {
  const bar = 20;
  const plan: readonly [number, number][] = [
    [0.4, 8],
    [0.6, 5],
    [0.8, 3],
  ];
  return plan
    .map(([pct, reps]) => ({
      kg: Math.max(bar, Math.round((kg * pct) / 2.5) * 2.5),
      reps,
      done: false,
    }))
    .filter((set, i, all) => i === 0 || set.kg > (all[i - 1]?.kg ?? 0));
}

export function shouldOfferWarmup(exercise: SessionExercise): boolean {
  const first = exercise.sets[0];
  return (
    !exercise.bodyweight &&
    !exercise.cardio &&
    first !== undefined &&
    (first.kg ?? 0) >= 40 &&
    !exercise.warmup &&
    !exercise.warmupSkipped &&
    !exercise.sets.some((s) => s.done)
  );
}

export type PlateColor = 'danger' | 'run' | 'warnText' | 'brand' | 'text2' | 'text3' | 'switchOff';

/** [weight per side, color token, drawn height] from the prototype's `PL` table (kg). */
export const PLATES: readonly { kg: number; color: PlateColor; height: number }[] = [
  { kg: 25, color: 'danger', height: 104 },
  { kg: 20, color: 'run', height: 100 },
  { kg: 15, color: 'warnText', height: 92 },
  { kg: 10, color: 'brand', height: 80 },
  { kg: 5, color: 'text2', height: 62 },
  { kg: 2.5, color: 'text3', height: 48 },
  { kg: 1.25, color: 'switchOff', height: 38 },
];

export type PlatesPlan = {
  side: { kg: number; color: PlateColor; height: number }[];
  counts: { kg: number; color: PlateColor; count: number }[];
  /** Total weight the plates could not cover. */
  missingKg: number;
  exact: boolean;
  belowBar: boolean;
};

/** Greedy plate loading per side (prototype `planVals`). */
export function platesPlan(totalKg: number, barKg: number): PlatesPlan {
  let rem = Math.max(0, (totalKg - barKg) / 2);
  const side: PlatesPlan['side'] = [];
  const counts = new Map<number, number>();
  for (const plate of PLATES) {
    while (rem + 1e-6 >= plate.kg && side.length < 10) {
      side.push(plate);
      rem = Math.round((rem - plate.kg) * 100) / 100;
      counts.set(plate.kg, (counts.get(plate.kg) ?? 0) + 1);
    }
  }
  return {
    side,
    counts: PLATES.filter((p) => counts.has(p.kg)).map((p) => ({
      kg: p.kg,
      color: p.color,
      count: counts.get(p.kg) ?? 0,
    })),
    missingKg: Math.round(rem * 2 * 100) / 100,
    exact: rem < 0.01,
    belowBar: totalKg < barKg,
  };
}

/** Totals, PRs and next-session suggestions (prototype `finish`). */
export function buildSummary(session: ActiveSession): SessionSummary {
  let sets = 0;
  let reps = 0;
  let volumeKg = 0;
  const prs: SessionSummary['prs'] = [];
  const rows: SessionSummary['rows'] = [];
  for (const e of session.exercises) {
    const done = e.sets.filter((s) => s.done);
    sets += done.length;
    for (const s of done) {
      reps += s.reps;
      if (s.kg) volumeKg += s.kg * s.reps;
    }
    rows.push({ name: e.name, sets: done.map((s) => ({ kg: s.kg, reps: s.reps })) });
    if (!done.length || !e.prev.length) continue;
    if (e.bodyweight) {
      const best = Math.max(...done.map((s) => s.reps));
      const previous = Math.max(...e.prev.map((p) => p[1]));
      if (best > previous) prs.push({ name: e.name, value: best, previous, bodyweight: true });
    } else {
      const best = Math.max(...done.map((s) => s.kg ?? 0));
      const previous = Math.max(...e.prev.map((p) => p[0] ?? 0));
      if (best > previous) prs.push({ name: e.name, value: best, previous, bodyweight: false });
    }
  }
  const next = session.exercises
    .filter(
      (e) =>
        !e.bodyweight &&
        !e.cardio &&
        e.targetReps > 0 &&
        e.sets.length > 0 &&
        e.sets.every((s) => s.done && s.reps >= e.targetReps),
    )
    .map((e) => {
      const top = Math.max(...e.sets.map((s) => s.kg ?? 0));
      return { name: e.name, kg: Math.round((top + suggestionStep(e)) * 100) / 100 };
    });
  return {
    name: session.name,
    focus: session.focus,
    durationSec: session.elapsedSec,
    sets,
    reps,
    volumeKg,
    prs,
    next,
    rows,
  };
}

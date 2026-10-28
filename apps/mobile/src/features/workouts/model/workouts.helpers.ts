import { exerciseLibrary, programs, routines } from './workouts.mock';

import type {
  BuilderDraft,
  DraftExercise,
  IntervalsConfig,
  LibraryExercise,
  Program,
  Race,
  Routine,
  RoutineExercise,
} from './workouts.types';

/** Accent/case-insensitive comparison key. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Seconds → "m:ss" / "h:mm:ss". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(x).padStart(2, '0')}`;
}

/** Kilograms as the prototype prints them (comma decimal). */
export function formatKg(kg: number): string {
  return String(kg).replace('.', ',');
}

/** Seeded routines overridden/extended by the user's custom ones. */
export function mergeRoutines(custom: Routine[]): Routine[] {
  const base = routines.map((r) => custom.find((c) => c.id === r.id) ?? r);
  return base.concat(custom.filter((c) => !routines.some((r) => r.id === c.id)));
}

/** Next free routine letter after the seeded A/B/C. */
export function nextRoutineId(all: Routine[]): string {
  const used = new Set(all.map((r) => r.id));
  for (const letter of 'DEFGHIJKLMNOPQRSTUVWXYZ') if (!used.has(letter)) return letter;
  return 'X';
}

/** Library with user exercises first, favorites on top (prototype `lib()`). */
export function mergeLibrary(
  userExercises: LibraryExercise[],
  favorites: string[],
): LibraryExercise[] {
  const all = [
    ...userExercises,
    ...exerciseLibrary.map((e) => (favorites.includes(e.id) ? { ...e, favorite: true } : e)),
  ];
  return [...all.filter((e) => e.favorite), ...all.filter((e) => !e.favorite)];
}

/** Estimated duration in minutes: 40s per set + rest, cardio in minutes. */
export function estimateMinutes(exercises: RoutineExercise[]): number {
  const seconds = exercises.reduce(
    (acc, e) => acc + (e.cardio ? e.reps * 60 : e.sets * (40 + e.rest)),
    0,
  );
  return Math.max(5, Math.round(seconds / 60));
}

export function countSets(exercises: RoutineExercise[]): number {
  return exercises.reduce((acc, e) => acc + (e.cardio ? 0 : e.sets), 0);
}

/** Last-session sets for an exercise name across all routines (prototype `findPrev`). */
export function findPrev(all: Routine[], exerciseId: string): RoutineExercise['prev'] {
  for (const r of all)
    for (const e of r.exercises) if (e.exerciseId === exerciseId && e.prev.length) return e.prev;
  return [];
}

/** Builds a draft exercise from a library entry (prototype `fromLib`). */
export function draftFromLibrary(lib: LibraryExercise, all: Routine[]): DraftExercise {
  const prev = findPrev(all, lib.id);
  const cardio = lib.type === 'c';
  return {
    exerciseId: lib.id,
    name: lib.name,
    group: lib.group,
    equipment: lib.equipment,
    sets: cardio ? 1 : prev.length || 3,
    reps: lib.reps,
    kg: lib.type === 's' ? (prev[0]?.[0] ?? lib.kg) : null,
    rest: lib.rest,
    superset: null,
    cardio,
    prev,
  };
}

export function emptyDraft(): BuilderDraft {
  return { id: null, name: '', description: '', day: null, exercises: [], open: -1 };
}

export function draftFromRoutine(routine: Routine): BuilderDraft {
  return {
    id: routine.id,
    name: routine.name,
    description: routine.focus,
    day: routine.day,
    exercises: routine.exercises.map((e) => ({ ...e, prev: [...e.prev] })),
    open: -1,
  };
}

/** Focus line derived from the description or the first muscle groups. */
export function draftFocus(draft: BuilderDraft): string {
  const desc = draft.description.trim();
  if (desc) return desc;
  const groups = [...new Set(draft.exercises.map((e) => e.group))];
  return groups.slice(0, 2).join(' & ') + (groups.length > 2 ? ` +${groups.length - 2}` : '');
}

export type IntervalPhase = {
  kind: 'warm' | 'work' | 'recover' | 'cool';
  seconds: number;
  /** 1-based index of the work interval (work phases only). */
  index?: number;
};

/** Phases of an interval run (prototype `intPhases`); cool-down is a fixed 5 min. */
export function intervalPhases(c: IntervalsConfig): IntervalPhase[] {
  const out: IntervalPhase[] = [{ kind: 'warm', seconds: c.warm }];
  for (let i = 1; i <= c.reps; i++) {
    out.push({ kind: 'work', seconds: c.work, index: i });
    if (i < c.reps) out.push({ kind: 'recover', seconds: c.rest });
  }
  out.push({ kind: 'cool', seconds: 300 });
  return out;
}

export type RaceView = {
  date: Date;
  days: number;
  /** Estimated finish time at the recent pace (s). */
  estimate: number;
  /** Required pace to hit the goal (s/km). */
  requiredPace: number;
  /** Estimate minus goal (s); <= 0 means already inside the target. */
  diff: number;
};

/** Race countdown and pace math (prototype `raceView`). Today is 26 Oct 2026 in the mock. */
export function raceView(race: Race, recentPace: number): RaceView {
  const date = new Date(2026, 9, 26 + race.weeks * 7);
  const estimate = recentPace * race.km * (1 + (race.km > 10 ? 0.04 : 0));
  const requiredPace = race.goal / race.km;
  return { date, days: race.weeks * 7, estimate, requiredPace, diff: estimate - race.goal };
}

export const RACE_DISTANCES: { distance: Race['distance']; km: number }[] = [
  { distance: 5, km: 5 },
  { distance: 10, km: 10 },
  { distance: 21, km: 21.0975 },
  { distance: 42, km: 42.195 },
];

/** Default goal for a distance: 5:30 /km rounded to the minute. */
export function defaultGoal(km: number): number {
  return Math.round((km * 330) / 60) * 60;
}

export function findProgram(id: string | null | undefined): Program | null {
  return programs.find((p) => p.id === id) ?? null;
}

/** 7-day plan strip: routine letters on their days, runs on Tue/Sat, or the active program pattern. */
export function weekPlan(all: Routine[], program: Program | null): string[] {
  const plan = ['—', '⟶', '—', '—', '—', '⟶', '—'];
  for (const r of all) if (r.day != null) plan[r.day] = r.id;
  if (program) program.pattern.forEach((p, i) => (plan[i] = p));
  return plan;
}

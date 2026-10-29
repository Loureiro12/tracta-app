import { create } from 'zustand';

import {
  PLATES_STEP,
  activeSetIndex,
  allSetsDone,
  buildFreeSession,
  buildSession,
  buildSummary,
  suggestionFor,
  warmupSets,
} from './session.logic';

import type {
  ActiveSession,
  PlateBar,
  RestState,
  SessionExercise,
  SessionSummary,
} from './session.types';
import type { routines } from '@tracta/api';

/** What happened after completing a set: the screen decides where to navigate. */
export type CompleteResult = 'rest' | 'continue' | 'all-done' | 'finished' | 'none';

type SessionState = {
  session: ActiveSession | null;
  rest: RestState | null;
  summary: SessionSummary | null;
  platesKg: number;
  platesBar: PlateBar;

  /** Starts a routine session from its plan, or a free session with `null`. No-op if one is active. */
  startSession: (routine: routines.Routine | null) => void;
  /** Seeds a paused, partially done session for the "recovered session" sheet when nothing is active. */
  seedRecoveredSession: (routine: routines.Routine) => void;
  endSession: () => void;
  tick: () => void;
  togglePause: () => void;
  pause: () => void;
  resume: () => void;

  selectExercise: (index: number) => void;
  prevExercise: () => void;
  nextExercise: () => void;
  adjustSet: (setIndex: number, field: 'kg' | 'reps', delta: number) => void;
  toggleSet: (setIndex: number) => void;
  addSet: () => void;
  removeSet: () => void;
  completeActiveSet: () => CompleteResult;

  applySuggestion: () => void;
  dismissSuggestion: () => void;
  addWarmup: () => void;
  skipWarmup: () => void;
  toggleWarmup: (index: number) => void;

  restTick: () => void;
  restAdjust: (deltaSec: number) => void;
  restTogglePause: () => void;
  clearRest: () => void;

  finish: () => void;
  openPlates: (kg: number) => void;
  adjustPlates: (delta: number) => void;
  setPlatesBar: (bar: PlateBar) => void;
};

function patchSession(
  session: ActiveSession | null,
  fn: (draft: ActiveSession) => void,
): ActiveSession | null {
  if (!session) return session;
  const draft: ActiveSession = {
    ...session,
    exercises: session.exercises.map((e) => ({
      ...e,
      sets: e.sets.map((s) => ({ ...s })),
      warmup: e.warmup ? e.warmup.map((s) => ({ ...s })) : null,
    })),
  };
  fn(draft);
  return draft;
}

function current(session: ActiveSession): SessionExercise | undefined {
  return session.exercises[session.exerciseIndex];
}

function hasPending(e: SessionExercise): boolean {
  return e.sets.some((s) => !s.done);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  rest: null,
  summary: null,
  platesKg: 60,
  platesBar: 20,

  startSession: (plan) => {
    if (get().session) return;
    const session = plan ? buildSession(plan, Date.now()) : buildFreeSession(Date.now());
    set({ session, rest: null, summary: null });
  },

  seedRecoveredSession: (plan) => {
    if (get().session) return;
    const session = buildSession(plan, Date.now() - 14 * 60 * 1000);
    session.elapsedSec = 14 * 60 + 12;
    session.paused = true;
    session.exerciseIndex = 1;
    session.exercises[0]?.sets.forEach((s) => {
      s.done = true;
    });
    const second = session.exercises[1]?.sets[0];
    if (second) second.done = true;
    set({ session, rest: null, summary: null });
  },

  endSession: () => set({ session: null, rest: null, summary: null }),

  tick: () =>
    set((state) =>
      state.session && !state.session.paused
        ? { session: { ...state.session, elapsedSec: state.session.elapsedSec + 1 } }
        : {},
    ),

  togglePause: () =>
    set((state) =>
      state.session ? { session: { ...state.session, paused: !state.session.paused } } : {},
    ),

  pause: () =>
    set((state) => (state.session ? { session: { ...state.session, paused: true } } : {})),

  resume: () =>
    set((state) => (state.session ? { session: { ...state.session, paused: false } } : {})),

  selectExercise: (index) =>
    set((state) =>
      state.session
        ? {
            session: {
              ...state.session,
              exerciseIndex: Math.max(0, Math.min(state.session.exercises.length - 1, index)),
            },
          }
        : {},
    ),

  prevExercise: () => {
    const s = get().session;
    if (s) get().selectExercise(s.exerciseIndex - 1);
  },

  nextExercise: () => {
    const s = get().session;
    if (s) get().selectExercise(s.exerciseIndex + 1);
  },

  adjustSet: (setIndex, field, delta) =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const target = current(d)?.sets[setIndex];
        if (!target) return;
        if (field === 'kg')
          target.kg = Math.max(0, Math.round(((target.kg ?? 0) + delta) * 100) / 100);
        else target.reps = Math.max(0, target.reps + delta);
      }),
    })),

  toggleSet: (setIndex) =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const target = current(d)?.sets[setIndex];
        if (target) target.done = !target.done;
      }),
    })),

  addSet: () =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const e = current(d);
        const last = e?.sets[e.sets.length - 1];
        if (e && last) e.sets.push({ kg: last.kg, reps: last.reps, done: false });
      }),
    })),

  removeSet: () =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const e = current(d);
        if (e && e.sets.length > 1) e.sets.pop();
      }),
    })),

  completeActiveSet: () => {
    const before = get().session;
    if (!before) return 'none';
    const exercise = current(before);
    if (!exercise) return 'none';
    const idx = activeSetIndex(exercise);
    if (idx < 0) {
      // Nothing pending here: jump to the next exercise with open sets, or finish.
      const ni = before.exercises.findIndex(hasPending);
      if (ni >= 0) {
        get().selectExercise(ni);
        return 'continue';
      }
      get().finish();
      return 'finished';
    }
    let supersetSkip = false;
    const session = patchSession(before, (d) => {
      const e = current(d);
      if (!e) return;
      const set0 = e.sets[idx];
      if (set0) set0.done = true;
      let moved = false;
      if (e.superset) {
        const members = d.exercises
          .map((x, k) => (x.superset === e.superset ? k : -1))
          .filter((k) => k >= 0);
        const pos = members.indexOf(d.exerciseIndex);
        const after = members.slice(pos + 1).find((k) => hasPending(d.exercises[k]!));
        if (after !== undefined) {
          d.exerciseIndex = after;
          supersetSkip = true;
          moved = true;
        } else {
          const first = members.find((k) => hasPending(d.exercises[k]!));
          if (first !== undefined) {
            d.exerciseIndex = first;
            moved = true;
          }
        }
      }
      if (!moved && e.sets.every((s) => s.done)) {
        const ni = d.exercises.findIndex((x, k) => k > d.exerciseIndex && hasPending(x));
        if (ni >= 0) d.exerciseIndex = ni;
      }
    });
    if (!session) return 'none';
    const done = allSetsDone(session);
    const rest =
      !done && !supersetSkip && exercise.restSec > 0
        ? { remainingSec: exercise.restSec, totalSec: exercise.restSec, paused: false }
        : null;
    set({ session, rest });
    if (done) return 'all-done';
    return rest ? 'rest' : 'continue';
  },

  applySuggestion: () =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const e = current(d);
        if (!e) return;
        const suggestion = suggestionFor(e);
        if (suggestion) {
          e.sets.forEach((s) => {
            if (!s.done) s.kg = suggestion.to;
          });
        }
        e.suggestionDismissed = true;
      }),
    })),

  dismissSuggestion: () =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const e = current(d);
        if (e) e.suggestionDismissed = true;
      }),
    })),

  addWarmup: () =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const e = current(d);
        const kg = e?.sets[0]?.kg;
        if (e && kg) e.warmup = warmupSets(kg);
      }),
    })),

  skipWarmup: () =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const e = current(d);
        if (e) e.warmupSkipped = true;
      }),
    })),

  toggleWarmup: (index) =>
    set((state) => ({
      session: patchSession(state.session, (d) => {
        const target = current(d)?.warmup?.[index];
        if (target) target.done = !target.done;
      }),
    })),

  restTick: () =>
    set((state) =>
      state.rest && !state.rest.paused
        ? { rest: { ...state.rest, remainingSec: Math.max(0, state.rest.remainingSec - 1) } }
        : {},
    ),

  restAdjust: (deltaSec) =>
    set((state) =>
      state.rest
        ? {
            rest: {
              ...state.rest,
              remainingSec: Math.max(0, state.rest.remainingSec + deltaSec),
              totalSec: Math.max(15, state.rest.totalSec + deltaSec),
            },
          }
        : {},
    ),

  restTogglePause: () =>
    set((state) => (state.rest ? { rest: { ...state.rest, paused: !state.rest.paused } } : {})),

  clearRest: () => set({ rest: null }),

  finish: () => {
    const session = get().session;
    if (session) set({ summary: buildSummary(session), rest: null });
  },

  openPlates: (kg) => set({ platesKg: kg > 0 ? kg : 20 }),

  adjustPlates: (delta) =>
    set((state) => ({
      platesKg: Math.max(0, Math.round((state.platesKg + delta * PLATES_STEP) * 100) / 100),
    })),

  setPlatesBar: (bar) => set({ platesBar: bar }),
}));

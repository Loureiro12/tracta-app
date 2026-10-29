import { create } from 'zustand';

import { distanceKm, elapsedSec } from './run.logic';
import { SWIM_DEFAULT_M, SWIM_MAX_M, SWIM_MIN_M, SWIM_STEP_M, modalities } from './run.mock';

import type { ActiveRun, IntervalConfig, ModalityId, RunSummary, SavingState } from './run.types';

type RunState = {
  /** The activity in progress (also while minimized or on the summary). */
  run: ActiveRun | null;
  /** Snapshot taken when the user taps "Finish"; null while the live screen is open. */
  summary: RunSummary | null;
  notes: string;
  saving: SavingState;
  startRun: (type: ModalityId, gps: boolean, intervals?: IntervalConfig | null) => void;
  togglePause: () => void;
  /** Freezes the activity into a summary (keeps the run paused underneath). */
  endRun: () => void;
  /** "Back to activity": drops the summary snapshot. */
  backToRun: () => void;
  setNotes: (notes: string) => void;
  adjustSwim: (deltaSteps: number) => void;
  setSaving: (saving: SavingState) => void;
  /** Clears everything (after save or discard). */
  reset: () => void;
};

const initial = { run: null, summary: null, notes: '', saving: 0 as SavingState };

/** In-memory state of the activity in progress; the summary saves it through `useSaveActivity`. */
export const useRunStore = create<RunState>((set, get) => ({
  ...initial,
  startRun: (type, gps, intervals = null) => {
    if (get().run) return;
    set({
      ...initial,
      run: {
        type,
        gps: gps && modalities[type].gps,
        intervals,
        startedAt: Date.now(),
        pausedAt: null,
        pausedTotalMs: 0,
      },
    });
  },
  togglePause: () => {
    const run = get().run;
    if (!run) return;
    const now = Date.now();
    set({
      run: run.pausedAt
        ? { ...run, pausedAt: null, pausedTotalMs: run.pausedTotalMs + (now - run.pausedAt) }
        : { ...run, pausedAt: now },
    });
  },
  endRun: () => {
    const run = get().run;
    if (!run) return;
    const now = Date.now();
    const paused = run.pausedAt ? run : { ...run, pausedAt: now };
    const sec = elapsedSec(paused, now);
    set({
      run: paused,
      summary: {
        type: run.type,
        gps: run.gps,
        sec,
        distKm: distanceKm(run, sec),
        swimMeters: modalities[run.type].swim ? SWIM_DEFAULT_M : null,
      },
      saving: 0,
    });
  },
  backToRun: () => set({ summary: null, saving: 0 }),
  setNotes: (notes) => set({ notes }),
  adjustSwim: (deltaSteps) => {
    const summary = get().summary;
    if (!summary || summary.swimMeters === null) return;
    const next = summary.swimMeters + deltaSteps * SWIM_STEP_M;
    set({ summary: { ...summary, swimMeters: Math.max(SWIM_MIN_M, Math.min(SWIM_MAX_M, next)) } });
  },
  setSaving: (saving) => set({ saving }),
  reset: () => set({ ...initial }),
}));

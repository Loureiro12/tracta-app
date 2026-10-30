import { create } from 'zustand';

import { locationSource, useLocationStore } from '@/shared/location';

import { summarize } from './run.logic';
import { SWIM_DEFAULT_M, SWIM_MAX_M, SWIM_MIN_M, SWIM_STEP_M, modalities } from './run.mock';

import type { ActiveRun, IntervalConfig, ModalityId, RunSummary, SavingState } from './run.types';
import type { TrackingOptions } from '@/shared/location';

type RunState = {
  /** The activity in progress (also while minimized or on the summary). */
  run: ActiveRun | null;
  /** Snapshot taken when the user taps "Finish"; null while the live screen is open. */
  summary: RunSummary | null;
  notes: string;
  saving: SavingState;
  /**
   * Starts the activity; GPS modalities start recording location too. When location turns out
   * to be unavailable (denied, services off) the activity continues without GPS.
   */
  startRun: (
    type: ModalityId,
    gps: boolean,
    intervals: IntervalConfig | null,
    notification: TrackingOptions['notification'],
  ) => void;
  togglePause: () => void;
  /** Freezes the activity into a summary (keeps the run paused underneath). */
  endRun: () => void;
  /** "Back to activity": drops the summary snapshot. */
  backToRun: () => void;
  setNotes: (notes: string) => void;
  adjustSwim: (deltaSteps: number) => void;
  setSaving: (saving: SavingState) => void;
  /** Clears everything (after save or discard) and stops recording location. */
  reset: () => void;
};

const initial = { run: null, summary: null, notes: '', saving: 0 as SavingState };

function stopTracking() {
  useLocationStore.getState().clear();
  void locationSource.stop();
}

/**
 * In-memory state of the activity in progress; the summary saves it through `useSaveActivity`.
 * GPS points live in `useLocationStore` (also while minimized) and are never sent before saving.
 */
export const useRunStore = create<RunState>((set, get) => ({
  ...initial,
  startRun: (type, gps, intervals, notification) => {
    if (get().run) return;
    const withGps = gps && modalities[type].gps;
    const startedAt = Date.now();
    set({
      ...initial,
      run: { type, gps: withGps, intervals, startedAt, pausedAt: null, pauses: [] },
    });
    if (!withGps) return;
    useLocationStore.getState().clear();
    const pace = modalities[type].paceSec;
    void locationSource
      .start({ notification, ...(pace ? { paceHintSec: pace } : {}) })
      .catch(() => false)
      .then((ok) => {
        const run = get().run;
        if (!ok && run && run.startedAt === startedAt) set({ run: { ...run, gps: false } });
      });
  },
  togglePause: () => {
    const run = get().run;
    if (!run) return;
    const now = Date.now();
    set({
      run: run.pausedAt
        ? { ...run, pausedAt: null, pauses: [...run.pauses, [run.pausedAt, now]] }
        : { ...run, pausedAt: now },
    });
  },
  endRun: () => {
    const run = get().run;
    if (!run) return;
    const now = Date.now();
    const paused = run.pausedAt ? run : { ...run, pausedAt: now };
    const swimMeters = modalities[run.type].swim ? SWIM_DEFAULT_M : null;
    set({
      run: paused,
      summary: summarize(paused, useLocationStore.getState().points, now, swimMeters),
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
  reset: () => {
    if (get().run?.gps) stopTracking();
    set({ ...initial });
  },
}));

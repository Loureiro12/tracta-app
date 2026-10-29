import { create } from 'zustand';

import { defaultGoal } from './workouts.helpers';

import type { BuilderDraft, DraftExercise, IntervalsConfig, Race } from './workouts.types';

export const DEFAULT_RACE: Race = { distance: 10, km: 10, weeks: 6, goal: defaultGoal(10) };
export const DEFAULT_INTERVALS: IntervalsConfig = { reps: 6, work: 60, rest: 90, warm: 300 };

/** Local UI state only; routines, library, programs and race are server state (see `api/`). */
type WorkoutsState = {
  /** Workout builder draft (kept here so the picker route can add to it). */
  draft: BuilderDraft | null;
  setDraft: (draft: BuilderDraft | null) => void;
  updateDraft: (recipe: (draft: BuilderDraft) => void) => void;
  addExercisesToDraft: (exercises: DraftExercise[]) => void;

  /** Exercise ids selected in the picker. */
  pickerSelection: string[];
  togglePickerSelection: (id: string) => void;
  setPickerSelection: (ids: string[]) => void;

  intervals: IntervalsConfig;
  setIntervals: (config: Partial<IntervalsConfig>) => void;
};

export const useWorkoutsStore = create<WorkoutsState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  updateDraft: (recipe) =>
    set((s) => {
      if (!s.draft) return {};
      const next: BuilderDraft = {
        ...s.draft,
        exercises: s.draft.exercises.map((e) => ({ ...e })),
      };
      recipe(next);
      return { draft: next };
    }),
  addExercisesToDraft: (added) =>
    set((s) =>
      s.draft
        ? {
            draft: {
              ...s.draft,
              exercises: [...s.draft.exercises, ...added],
              open: s.draft.exercises.length,
            },
            pickerSelection: [],
          }
        : {},
    ),

  pickerSelection: [],
  togglePickerSelection: (id) =>
    set((s) => ({
      pickerSelection: s.pickerSelection.includes(id)
        ? s.pickerSelection.filter((x) => x !== id)
        : [...s.pickerSelection, id],
    })),
  setPickerSelection: (pickerSelection) => set({ pickerSelection }),

  intervals: DEFAULT_INTERVALS,
  setIntervals: (config) => set((s) => ({ intervals: { ...s.intervals, ...config } })),
}));

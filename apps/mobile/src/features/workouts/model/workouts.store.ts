import { create } from 'zustand';

import { defaultGoal, draftFromLibrary, mergeLibrary, mergeRoutines } from './workouts.helpers';
import { exerciseIdFromName } from './workouts.mock';

import type {
  ActiveProgram,
  BuilderDraft,
  IntervalsConfig,
  LibraryExercise,
  Race,
  Routine,
} from './workouts.types';

export const DEFAULT_RACE: Race = { distance: 10, km: 10, weeks: 6, goal: defaultGoal(10) };
export const DEFAULT_INTERVALS: IntervalsConfig = { reps: 6, work: 60, rest: 90, warm: 300 };

type WorkoutsState = {
  /** Subscription flag (layout only): gates Programs, Minha prova and Corrida intervalada. */
  isPro: boolean;
  setPro: (isPro: boolean) => void;

  /** Routines created or edited by the user (override seeded ones by id). */
  customRoutines: Routine[];
  upsertRoutine: (routine: Routine) => void;

  /** Exercises registered by the user, favorites and personal notes (by exercise id). */
  userExercises: LibraryExercise[];
  favorites: string[];
  exerciseNotes: Record<string, string>;
  addUserExercise: (exercise: Omit<LibraryExercise, 'id' | 'custom'>) => LibraryExercise;
  updateUserExercise: (id: string, exercise: Omit<LibraryExercise, 'id' | 'custom'>) => void;
  removeUserExercise: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setExerciseNote: (id: string, note: string) => void;

  /** Workout builder draft (kept here so the picker route can add to it). */
  draft: BuilderDraft | null;
  setDraft: (draft: BuilderDraft | null) => void;
  updateDraft: (recipe: (draft: BuilderDraft) => void) => void;
  addExercisesToDraft: (ids: string[]) => void;

  /** Exercise ids selected in the picker. */
  pickerSelection: string[];
  togglePickerSelection: (id: string) => void;
  setPickerSelection: (ids: string[]) => void;

  activeProgram: ActiveProgram | null;
  setActiveProgram: (program: ActiveProgram | null) => void;

  race: Race | null;
  raceDraft: Race;
  setRaceDraft: (race: Race) => void;
  saveRace: () => void;
  clearRace: () => void;

  intervals: IntervalsConfig;
  setIntervals: (config: Partial<IntervalsConfig>) => void;
};

export const useWorkoutsStore = create<WorkoutsState>((set, get) => ({
  isPro: false,
  setPro: (isPro) => set({ isPro }),

  customRoutines: [],
  upsertRoutine: (routine) =>
    set((s) => ({
      customRoutines: [...s.customRoutines.filter((r) => r.id !== routine.id), routine],
    })),

  userExercises: [],
  favorites: [],
  exerciseNotes: {},
  addUserExercise: (exercise) => {
    const created: LibraryExercise = {
      ...exercise,
      id: exerciseIdFromName(exercise.name),
      custom: true,
    };
    set((s) => ({ userExercises: [...s.userExercises, created] }));
    return created;
  },
  updateUserExercise: (id, exercise) =>
    set((s) => ({
      userExercises: s.userExercises.map((e) => (e.id === id ? { ...e, ...exercise } : e)),
    })),
  removeUserExercise: (id) =>
    set((s) => ({ userExercises: s.userExercises.filter((e) => e.id !== id) })),
  toggleFavorite: (id) =>
    set((s) => {
      if (s.userExercises.some((e) => e.id === id)) {
        return {
          userExercises: s.userExercises.map((e) =>
            e.id === id ? { ...e, favorite: !e.favorite } : e,
          ),
        };
      }
      return {
        favorites: s.favorites.includes(id)
          ? s.favorites.filter((f) => f !== id)
          : [...s.favorites, id],
      };
    }),
  setExerciseNote: (id, note) =>
    set((s) => ({ exerciseNotes: { ...s.exerciseNotes, [id]: note } })),

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
  addExercisesToDraft: (ids) => {
    const s = get();
    if (!s.draft) return;
    const library = mergeLibrary(s.userExercises, s.favorites);
    const all = mergeRoutines(s.customRoutines);
    const added = ids
      .map((id) => library.find((e) => e.id === id))
      .filter((e): e is LibraryExercise => Boolean(e))
      .map((e) => draftFromLibrary(e, all));
    set({
      draft: {
        ...s.draft,
        exercises: [...s.draft.exercises, ...added],
        open: s.draft.exercises.length,
      },
      pickerSelection: [],
    });
  },

  pickerSelection: [],
  togglePickerSelection: (id) =>
    set((s) => ({
      pickerSelection: s.pickerSelection.includes(id)
        ? s.pickerSelection.filter((x) => x !== id)
        : [...s.pickerSelection, id],
    })),
  setPickerSelection: (pickerSelection) => set({ pickerSelection }),

  activeProgram: null,
  setActiveProgram: (activeProgram) => set({ activeProgram }),

  race: null,
  raceDraft: DEFAULT_RACE,
  setRaceDraft: (raceDraft) => set({ raceDraft }),
  saveRace: () => set((s) => ({ race: s.raceDraft })),
  clearRace: () => set({ race: null, raceDraft: DEFAULT_RACE }),

  intervals: DEFAULT_INTERVALS,
  setIntervals: (config) => set((s) => ({ intervals: { ...s.intervals, ...config } })),
}));

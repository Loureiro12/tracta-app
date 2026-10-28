import { create } from 'zustand';

import { TODAY, allExercises } from './history.mock';

import type { CardioGroup, CardioMetric, EvoKind, StrengthMetric } from './history.types';

type HistoryState = {
  /** Day of the month selected in the calendar. */
  selectedDay: number;
  /** Sessions removed with the 2-tap "Excluir" (mock persistence, in memory only). */
  deletedSessionIds: string[];
  /** Free-text notes per session id. */
  notes: Record<string, string>;
  evoKind: EvoKind;
  evoExerciseId: string;
  evoMetric: StrengthMetric;
  cardioGroup: CardioGroup;
  cardioMetric: CardioMetric;
  selectDay: (day: number) => void;
  deleteSession: (id: string) => void;
  setNote: (id: string, note: string) => void;
  setEvoKind: (kind: EvoKind) => void;
  setEvoExercise: (id: string) => void;
  setEvoMetric: (metric: StrengthMetric) => void;
  setCardioGroup: (group: CardioGroup) => void;
  setCardioMetric: (metric: CardioMetric) => void;
};

export const useHistoryStore = create<HistoryState>((set) => ({
  selectedDay: TODAY - 2,
  deletedSessionIds: [],
  notes: {},
  evoKind: 'strength',
  evoExerciseId: allExercises[0]?.id ?? '',
  evoMetric: 'kg',
  cardioGroup: 'all',
  cardioMetric: 'pace',
  selectDay: (selectedDay) => set({ selectedDay }),
  deleteSession: (id) =>
    set((s) => ({
      deletedSessionIds: s.deletedSessionIds.includes(id)
        ? s.deletedSessionIds
        : [...s.deletedSessionIds, id],
    })),
  setNote: (id, note) => set((s) => ({ notes: { ...s.notes, [id]: note } })),
  setEvoKind: (evoKind) => set({ evoKind }),
  setEvoExercise: (evoExerciseId) => set({ evoExerciseId }),
  setEvoMetric: (evoMetric) => set({ evoMetric }),
  setCardioGroup: (cardioGroup) => set({ cardioGroup }),
  setCardioMetric: (cardioMetric) => set({ cardioMetric }),
}));

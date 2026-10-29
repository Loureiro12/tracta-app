import { create } from 'zustand';

import type { CardioGroup, CardioMetric, EvoKind, StrengthMetric } from './history.types';

/** Local UI state of the History tab (server data lives in React Query, see ../api). */
type HistoryState = {
  /** Day picked in the calendar (YYYY-MM-DD); null = the latest day with activity. */
  selectedDate: string | null;
  evoKind: EvoKind;
  /** Exercise slug of the strength chart; null = the first exercise. */
  evoExercise: string | null;
  evoMetric: StrengthMetric;
  cardioGroup: CardioGroup;
  cardioMetric: CardioMetric;
  selectDate: (date: string) => void;
  setEvoKind: (kind: EvoKind) => void;
  setEvoExercise: (slug: string) => void;
  setEvoMetric: (metric: StrengthMetric) => void;
  setCardioGroup: (group: CardioGroup) => void;
  setCardioMetric: (metric: CardioMetric) => void;
};

export const useHistoryStore = create<HistoryState>((set) => ({
  selectedDate: null,
  evoKind: 'strength',
  evoExercise: null,
  evoMetric: 'kg',
  cardioGroup: 'all',
  cardioMetric: 'pace',
  selectDate: (selectedDate) => set({ selectedDate }),
  setEvoKind: (evoKind) => set({ evoKind }),
  setEvoExercise: (evoExercise) => set({ evoExercise }),
  setEvoMetric: (evoMetric) => set({ evoMetric }),
  setCardioGroup: (cardioGroup) => set({ cardioGroup }),
  setCardioMetric: (cardioMetric) => set({ cardioMetric }),
}));

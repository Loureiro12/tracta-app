import { create } from 'zustand';

export type HomeCardKey = 'sleep' | 'move' | 'stats' | 'next' | 'last';
export type HomeDensity = 'summary' | 'detailed';
export type HomeCard = { key: HomeCardKey; on: boolean };

const DEFAULT_CARDS: HomeCard[] = ['sleep', 'move', 'stats', 'next', 'last'].map((key) => ({
  key: key as HomeCardKey,
  on: true,
}));

type HomeState = {
  /** Ordered list of the customizable cards and whether each one is shown. */
  cards: HomeCard[];
  density: HomeDensity;
  /** Demo switch: renders the "Comece por aqui" checklist as a brand-new account would see it. */
  isNewUser: boolean;
  /** The dark weekly card disappears once the summary has been opened. */
  weeklySeen: boolean;
  moveCard: (key: HomeCardKey, direction: -1 | 1) => void;
  toggleCard: (key: HomeCardKey) => void;
  setDensity: (density: HomeDensity) => void;
  setNewUser: (isNewUser: boolean) => void;
  markWeeklySeen: () => void;
  reset: () => void;
};

/** Local UI state of the Home tab (card order/visibility, density). In-memory only for now. */
export const useHomeStore = create<HomeState>((set) => ({
  cards: DEFAULT_CARDS,
  density: 'summary',
  isNewUser: false,
  weeklySeen: false,
  moveCard: (key, direction) =>
    set((s) => {
      const i = s.cards.findIndex((c) => c.key === key);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= s.cards.length) return s;
      const cards = [...s.cards];
      const current = cards[i];
      const target = cards[j];
      if (!current || !target) return s;
      cards[i] = target;
      cards[j] = current;
      return { cards };
    }),
  toggleCard: (key) =>
    set((s) => ({ cards: s.cards.map((c) => (c.key === key ? { ...c, on: !c.on } : c)) })),
  setDensity: (density) => set({ density }),
  setNewUser: (isNewUser) => set({ isNewUser }),
  markWeeklySeen: () => set({ weeklySeen: true }),
  reset: () => set({ cards: DEFAULT_CARDS, density: 'summary' }),
}));

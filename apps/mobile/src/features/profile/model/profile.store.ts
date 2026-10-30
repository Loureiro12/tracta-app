import { create } from 'zustand';

/**
 * Local UI state for the Profile tab. Account data (name, e-mail, goals and preferences) is
 * server state: see `useAccount()` and `../api`.
 */
type ProfileState = {
  /** iOS-level permission; false shows the "notifications are off" warning (device only). */
  systemNotificationsAllowed: boolean;
  /**
   * Indexes into the photo list (newest first) for the side-by-side comparison. Clamped to the
   * list length when read, so `OLDEST` always means the last photo.
   */
  compareA: number;
  compareB: number;

  allowSystemNotifications: () => void;
  /** A photo was added at the top: A shows it, B keeps pointing at the same picture. */
  photoAdded: () => void;
  /** Next photo in a slot, wrapping around a list of `count` photos. */
  cycleCompare: (slot: 'a' | 'b', count: number) => void;
  /** Back to the initial state (sign-out / account deletion). */
  reset: () => void;
};

/** Compare slot sentinel for "the oldest photo". */
export const OLDEST = Number.MAX_SAFE_INTEGER;

const initial = {
  systemNotificationsAllowed: false,
  compareA: 0,
  compareB: OLDEST,
};

export const useProfileStore = create<ProfileState>((set) => ({
  ...initial,

  allowSystemNotifications: () => set({ systemNotificationsAllowed: true }),
  photoAdded: () =>
    set((s) => ({ compareA: 0, compareB: s.compareB === OLDEST ? OLDEST : s.compareB + 1 })),
  cycleCompare: (slot, count) =>
    set((s) => {
      if (count < 1) return {};
      const next = (i: number) => (Math.min(i, count - 1) + 1) % count;
      return slot === 'a' ? { compareA: next(s.compareA) } : { compareB: next(s.compareB) };
    }),
  reset: () => set(initial),
}));

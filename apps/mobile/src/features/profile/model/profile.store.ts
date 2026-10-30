import { create } from 'zustand';

import { PROGRESS_PHOTOS, TODAY_PHOTO } from './profile.mock';

import type { ProgressPhoto } from './profile.types';

/**
 * Local UI state for the Profile tab. Account data (name, e-mail, goals and preferences) is
 * server state: see `useAccount()` and `../api`.
 */
type ProfileState = {
  /** iOS-level permission; false shows the "notifications are off" warning (device only). */
  systemNotificationsAllowed: boolean;
  /** Apple Health connection (device only, no HealthKit integration yet). */
  healthConnected: boolean;
  photos: ProgressPhoto[];
  /** Indexes into `photos` for the side-by-side comparison. */
  compareA: number;
  compareB: number;

  allowSystemNotifications: () => void;
  disconnectHealth: () => void;
  addTodayPhoto: () => void;
  cycleCompare: (slot: 'a' | 'b') => void;
  /** Back to the initial state (sign-out / account deletion). */
  reset: () => void;
};

const initial = {
  systemNotificationsAllowed: false,
  healthConnected: true,
  photos: [...PROGRESS_PHOTOS],
  compareA: 0,
  compareB: 5,
};

export const useProfileStore = create<ProfileState>((set) => ({
  ...initial,

  allowSystemNotifications: () => set({ systemNotificationsAllowed: true }),
  disconnectHealth: () => set({ healthConnected: false }),
  addTodayPhoto: () =>
    set((s) => ({
      photos: [{ id: `new-${s.photos.length}`, ...TODAY_PHOTO }, ...s.photos],
      compareA: 0,
      compareB: Math.min(s.compareB + 1, s.photos.length),
    })),
  cycleCompare: (slot) =>
    set((s) => {
      const n = s.photos.length;
      if (slot === 'a') return { compareA: (Math.min(s.compareA, n - 1) + 1) % n };
      return { compareB: (Math.min(s.compareB, n - 1) + 1) % n };
    }),
  reset: () => set({ ...initial, photos: [...PROGRESS_PHOTOS] }),
}));

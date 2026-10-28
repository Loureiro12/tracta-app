import { create } from 'zustand';

import { GOAL_STEPS, PROGRESS_PHOTOS, REMINDER_HOUR, TODAY_PHOTO } from './profile.mock';

import type {
  Account,
  GoalKey,
  Goals,
  NotificationKey,
  NotificationPrefs,
  ProPlan,
  ProState,
  ProgressPhoto,
  Visibility,
} from './profile.types';

type ProfileState = {
  account: Account;
  pro: ProState;
  /** Plan highlighted in the paywall. */
  selectedPlan: ProPlan;
  visibility: Visibility;
  goals: Goals;
  notifications: NotificationPrefs;
  /** Minutes after midnight for the workout reminder (1110 = 18:30). */
  reminderMinutes: number;
  /** iOS-level permission; false shows the "notifications are off" warning. */
  systemNotificationsAllowed: boolean;
  healthConnected: boolean;
  photos: ProgressPhoto[];
  /** Indexes into `photos` for the side-by-side comparison. */
  compareA: number;
  compareB: number;

  updateAccount: (account: Account) => void;
  selectPlan: (plan: ProPlan) => void;
  subscribe: (plan: ProPlan) => void;
  restorePurchase: () => void;
  switchPlan: () => void;
  cancelPro: () => void;
  reactivatePro: () => void;
  cycleVisibility: () => Visibility;
  adjustGoal: (key: GoalKey, direction: 1 | -1) => void;
  toggleNotification: (key: NotificationKey) => void;
  adjustReminder: (direction: 1 | -1) => void;
  allowSystemNotifications: () => void;
  disconnectHealth: () => void;
  addTodayPhoto: () => void;
  cycleCompare: (slot: 'a' | 'b') => void;
};

const VISIBILITY_ORDER: readonly Visibility[] = ['friends', 'me', 'all'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Local UI state for the Profile tab and its overlays (mock data, in memory). */
export const useProfileStore = create<ProfileState>((set, get) => ({
  account: { name: 'Lucas Andrade', email: 'lucas@andrade.me' },
  pro: { active: false, plan: 'year', trial: false, cancelled: false },
  selectedPlan: 'year',
  visibility: 'friends',
  goals: { steps: 10000, sleep: 450, workouts: 4, runKm: 15 },
  notifications: {
    rest: true,
    sound: true,
    remind: true,
    daily: false,
    weekly: true,
    goals: true,
    sync: true,
  },
  reminderMinutes: 1110,
  systemNotificationsAllowed: false,
  healthConnected: true,
  photos: [...PROGRESS_PHOTOS],
  compareA: 0,
  compareB: 5,

  updateAccount: (account) => set({ account }),
  selectPlan: (selectedPlan) => set({ selectedPlan }),
  subscribe: (plan) =>
    set({ pro: { active: true, plan, trial: plan === 'year', cancelled: false } }),
  restorePurchase: () =>
    set({ pro: { active: true, plan: 'year', trial: false, cancelled: false } }),
  switchPlan: () =>
    set((s) => ({ pro: { ...s.pro, plan: s.pro.plan === 'month' ? 'year' : 'month' } })),
  cancelPro: () => set((s) => ({ pro: { ...s.pro, cancelled: true } })),
  reactivatePro: () => set((s) => ({ pro: { ...s.pro, cancelled: false } })),
  cycleVisibility: () => {
    const current = get().visibility;
    const next =
      VISIBILITY_ORDER[(VISIBILITY_ORDER.indexOf(current) + 1) % VISIBILITY_ORDER.length] ??
      current;
    set({ visibility: next });
    return next;
  },
  adjustGoal: (key, direction) =>
    set((s) => {
      const { step, min, max } = GOAL_STEPS[key];
      return { goals: { ...s.goals, [key]: clamp(s.goals[key] + direction * step, min, max) } };
    }),
  toggleNotification: (key) =>
    set((s) => ({ notifications: { ...s.notifications, [key]: !s.notifications[key] } })),
  adjustReminder: (direction) =>
    set((s) => ({
      reminderMinutes: clamp(
        s.reminderMinutes + direction * REMINDER_HOUR.step,
        REMINDER_HOUR.min,
        REMINDER_HOUR.max,
      ),
    })),
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
}));

/** Derived: whether Pro features are unlocked. */
export const selectIsPro = (s: ProfileState) => s.pro.active;

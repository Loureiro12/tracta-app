import type { GoalKey, NotificationKey, ProgressPhoto } from './profile.types';

/** Progress photos, newest first (prototype `extraVals`). Dates are data, weight in kg. */
export const PROGRESS_PHOTOS: readonly ProgressPhoto[] = [
  { id: '26-out', date: '26 out', kg: 78.4 },
  { id: '28-set', date: '28 set', kg: 79.6 },
  { id: '31-ago', date: '31 ago', kg: 80.9 },
  { id: '27-jul', date: '27 jul', kg: 81.8 },
  { id: '29-jun', date: '29 jun', kg: 82.6 },
  { id: '1-jun', date: '1 jun', kg: 83.5 },
];

/** Weight attached to a photo registered today. */
export const TODAY_PHOTO = { date: '27 out', kg: 78.3 } as const;

/** Goal steppers: step, min and max (prototype `gst`). */
export const GOAL_STEPS: Record<GoalKey, { step: number; min: number; max: number }> = {
  steps: { step: 500, min: 2000, max: 30000 },
  sleep: { step: 15, min: 300, max: 600 },
  workouts: { step: 1, min: 1, max: 7 },
  runKm: { step: 1, min: 0, max: 100 },
};

export const GOAL_KEYS: readonly GoalKey[] = ['steps', 'sleep', 'workouts', 'runKm'];

/** Notification groups in display order. */
export const NOTIFICATION_GROUPS: readonly {
  key: 'training' | 'reminders' | 'others';
  rows: readonly NotificationKey[];
}[] = [
  { key: 'training', rows: ['rest', 'sound'] },
  { key: 'reminders', rows: ['remind', 'daily', 'weekly'] },
  { key: 'others', rows: ['goals', 'sync'] },
];

/** Keys that count towards the "N on" summary (sound is a modifier, not a notification). */
export const NOTIFICATION_COUNTED: readonly NotificationKey[] = [
  'rest',
  'remind',
  'daily',
  'weekly',
  'goals',
  'sync',
];

export const REMINDER_HOUR = { step: 30, min: 300, max: 1380 } as const;

/** Paywall comparison table: free column value kind. */
export type PaywallRowKey =
  'workouts' | 'gps' | 'social' | 'programs' | 'race' | 'intervals' | 'evolution';
export const PAYWALL_ROWS: readonly { key: PaywallRowKey; free: 'yes' | 'no' | 'limited' }[] = [
  { key: 'workouts', free: 'yes' },
  { key: 'gps', free: 'yes' },
  { key: 'social', free: 'yes' },
  { key: 'programs', free: 'no' },
  { key: 'race', free: 'no' },
  { key: 'intervals', free: 'no' },
  { key: 'evolution', free: 'limited' },
];

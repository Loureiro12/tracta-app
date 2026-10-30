import type { GoalKey, NotificationKey } from './profile.types';

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

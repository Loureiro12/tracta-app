/**
 * Mock data for the Home tab, ported from the prototype (`homeVals`, `dailyVals`, `sleepVals`,
 * `stateVals` and the NIGHTS / HOURS consts). Numbers only; labels live in i18n.
 */

/** Monday, 26 October 2026 — the day every prototype screen shows. */

export const HEALTH_SYNC_TIME = '16:12';

export const sleep = {
  minutes: 410,
  score: 85,
  bedtime: '23:48',
  wakeTime: '07:00',
  regularityMinutes: 18,
  /** Last 7 nights in minutes (Tue → Mon). */
  nights: [412, 445, 398, 470, 488, 455, 410],
} as const;

export const movement = {
  steps: 6842,
  deltaPercent: 12,
  distanceKm: 4.9,
  activeKcal: 312,
  activeMinutes: 38,
  /** Steps per hour of today (0h → 23h); the current hour is index 16. */
  hours: [
    0, 0, 0, 0, 0, 0, 120, 640, 820, 310, 260, 410, 980, 540, 380, 620, 1762, 0, 0, 0, 0, 0, 0, 0,
  ],
  currentHour: 16,
} as const;

export const restingHr = { bpm: 58, deltaFromAverage: 2 } as const;

export type HomeChecklistStepId = 'health' | 'workout' | 'friend';

export const checklistSteps: readonly { id: HomeChecklistStepId; done: boolean }[] = [
  { id: 'health', done: false },
  { id: 'workout', done: false },
  { id: 'friend', done: false },
];

export const weekly = {
  workouts: 5,
  activeTime: '4h 12',
  distanceKm: 13.3,
  runs: 2,
  volumeTons: 30.1,
  strengthWorkouts: 3,
  /** Mon → Sun: 'strength' | 'run' | 'rest'; label is the routine letter or an arrow. */
  days: [
    { id: 'mon', kind: 'strength', label: 'A' },
    { id: 'tue', kind: 'run', label: '⟶' },
    { id: 'wed', kind: 'strength', label: 'B' },
    { id: 'thu', kind: 'rest', label: '—' },
    { id: 'fri', kind: 'strength', label: 'C' },
    { id: 'sat', kind: 'run', label: '⟶' },
    { id: 'sun', kind: 'rest', label: '—' },
  ] as const,
  changes: [
    { id: 'sleep', trend: 'up' },
    { id: 'steps', trend: 'up' },
    { id: 'hr', trend: 'flat' },
    { id: 'pace', trend: 'up' },
  ] as const,
  highlights: [
    { id: 'bench', tag: 'PR' },
    { id: 'squat', tag: 'PR' },
    { id: 'run', tag: 'KM' },
  ] as const,
  goals: [
    { id: 'workouts', progress: 1 },
    { id: 'steps', progress: 0.43 },
    { id: 'sleep', progress: 0.43 },
  ] as const,
  averageSteps: 9539,
} as const;

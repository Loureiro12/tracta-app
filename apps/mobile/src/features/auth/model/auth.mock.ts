/** Health data types the app can read (HealthKit / Health Connect). Labels live in i18n `health.read.*`. */
export const READ_TYPES = [
  'steps',
  'distance',
  'active',
  'resting',
  'heart',
  'sleep',
  'workouts',
] as const;
/** Data types the app can write back. Labels live in i18n `health.write.*`. */
export const WRITE_TYPES = ['workouts', 'distance'] as const;

export type ReadType = (typeof READ_TYPES)[number];
export type WriteType = (typeof WRITE_TYPES)[number];
export type PermissionKey = `read.${ReadType}` | `write.${WriteType}`;

/** Prototype defaults: every read type on, workouts written, distance not. */
export const DEFAULT_PERMISSIONS: Record<PermissionKey, boolean> = {
  'read.steps': true,
  'read.distance': true,
  'read.active': true,
  'read.resting': true,
  'read.heart': true,
  'read.sleep': true,
  'read.workouts': true,
  'write.workouts': true,
  'write.distance': false,
};

/** What the mock import "finds" once Apple Health is connected. Copy in i18n `connect.health.found.*`. */
export const FOUND_SOURCES = ['sleep', 'steps', 'heart', 'workouts'] as const;
export type FoundSource = (typeof FOUND_SOURCES)[number];

export type SocialProvider = 'Apple' | 'Google';

/** Mock accounts returned by the social sign-in buttons. */
export const SOCIAL_ACCOUNTS: Record<SocialProvider, { name: string; email: string }> = {
  Apple: { name: 'Lucas', email: 'lucas@icloud.com' },
  Google: { name: 'Lucas', email: 'lucas@gmail.com' },
};

/** Simulated network latency of the mock auth calls. */
export const REQUEST_DELAY_MS = 900;
/** How long the mock Apple Health import stays in the "busy" state. */
export const HEALTH_IMPORT_MS = 2000;
/** Seconds before the "resend link" button becomes available again. */
export const RESEND_SECONDS = 30;

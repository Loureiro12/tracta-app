export type HealthSegment = 'sleep' | 'activity' | 'body';
export type SleepRange = '7' | '30' | 'cmp';
export type MetricKey = 'steps' | 'hr' | 'cal' | 'dist' | 'sleep' | 'weight';
export type MetricPeriod = 'D' | 'W' | 'M';
export type ReportPeriod = '7' | '30' | 'custom';
export type SleepStage = 'awake' | 'rem' | 'light' | 'deep';
export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** A manual weight/measurements entry (the prototype's `bodyLog`). */
export type BodyLogEntry = {
  day: number;
  weight: number;
  waist: number;
  hip: number;
  arm: number;
};

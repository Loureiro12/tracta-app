// Device health data (Apple Health / Health Connect) behind one interface; E2E uses a fake.
export { getHealthSource } from './source';
export { collectHealthDays, lastDaysRange } from './aggregate';
export { fakeHealthSource } from './fake';
export type {
  DayActivity,
  HealthPermissions,
  HealthRange,
  HealthReadType,
  HealthSource,
  HealthSourceKind,
  HealthWriteType,
  HeartRateData,
  HeartRateSample,
  SleepSession,
  SleepStage,
  WorkoutKind,
  WorkoutToSave,
} from './types';

// Device health data (Apple Health / Health Connect) behind one interface; E2E uses a fake.
export {
  getGoogleHealthSource,
  getHealthSource,
  healthSourceName,
  isGoogleHealthAvailable,
} from './source';
export { GoogleHealthReconnectNeeded } from './google-auth';
export { GoogleHealthNoProfile } from './google-health';
export { collectBody, collectHealthDays, collectWorkouts, lastDaysRange } from './aggregate';
export { fakeHealthSource, setFakeHealthImport } from './fake';
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

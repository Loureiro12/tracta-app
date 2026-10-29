export { createTractaClient } from './client';
export type { TractaClient, TractaClientOptions } from './client';
export { ApiError, toApiError } from './errors';
export type { ApiErrorCode } from './errors';
export type { Database, Json } from './database.types';

export * as auth from './domains/auth';
export type { AuthUser, SignInInput, SignUpInput } from './domains/auth';
export * as account from './domains/account';
export type {
  Account,
  Goals,
  NotificationKey,
  Profile,
  Settings,
  SettingsPatch,
  ShareKey,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  Units,
  Visibility,
} from './domains/account';

// Domain modules (types are reachable as namespace members, e.g. `routines.Routine`).
export * as exercises from './domains/exercises';
export * as routines from './domains/routines';
export * as programs from './domains/programs';
export * as sessions from './domains/sessions';
export * as activities from './domains/activities';
export * as body from './domains/body';
export * as history from './domains/history';
export * as social from './domains/social';
export * as notifications from './domains/notifications';

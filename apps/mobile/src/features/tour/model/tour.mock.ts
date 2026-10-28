import type { IconName } from '@tracta/design-system';

export type TourTab = 'home' | 'health' | 'workouts' | 'history' | 'profile';
/** Copy for each spotlight lives in i18n `steps.<key>`. */
export type SpotKey = 'home' | 'health' | 'workouts' | 'session' | 'history' | 'profile';

export type SpotStep = { kind: 'spot'; key: SpotKey; tab: TourTab };
export type TourStep = { kind: 'welcome' } | { kind: 'done' } | SpotStep;

/** The five tabs drawn under the spotlight, in tab-bar order (labels from `common:tabs`). */
export const TOUR_TABS: readonly { key: TourTab; icon: IconName }[] = [
  { key: 'home', icon: 'home' },
  { key: 'health', icon: 'heart' },
  { key: 'workouts', icon: 'activity' },
  { key: 'history', icon: 'calendar' },
  { key: 'profile', icon: 'user' },
];

export const WELCOME_STEP: TourStep = { kind: 'welcome' };

/** Prototype `TOUR`: welcome modal → 6 spotlights → "all set" modal. */
export const SPOT_STEPS: readonly SpotStep[] = [
  { kind: 'spot', key: 'home', tab: 'home' },
  { kind: 'spot', key: 'health', tab: 'health' },
  { kind: 'spot', key: 'workouts', tab: 'workouts' },
  { kind: 'spot', key: 'session', tab: 'workouts' },
  { kind: 'spot', key: 'history', tab: 'history' },
  { kind: 'spot', key: 'profile', tab: 'profile' },
];

export const TOUR_STEPS: readonly TourStep[] = [WELCOME_STEP, ...SPOT_STEPS, { kind: 'done' }];

export const WELCOME_ITEMS = [1, 2, 3, 4] as const;

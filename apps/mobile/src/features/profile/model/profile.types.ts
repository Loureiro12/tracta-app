export type ProPlan = 'year' | 'month';

export type ProState = {
  active: boolean;
  plan: ProPlan;
  /** Yearly plan starts with 7 free days. */
  trial: boolean;
  /** Cancelled subscriptions keep access until the end of the paid period. */
  cancelled: boolean;
};

export type Visibility = 'friends' | 'me' | 'all';

export type GoalKey = 'steps' | 'sleep' | 'workouts' | 'runKm';
export type Goals = Record<GoalKey, number>;

export type NotificationKey = 'rest' | 'sound' | 'remind' | 'daily' | 'weekly' | 'goals' | 'sync';

export type ProgressPhoto = { id: string; date: string; kg: number };

/** Pro features that open the paywall with a context line ("Programas faz parte do Pro"). */
export type PaywallContext = 'programs' | 'race' | 'intervals' | 'evolution';

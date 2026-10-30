export type Visibility = 'friends' | 'me' | 'all';

export type GoalKey = 'steps' | 'sleep' | 'workouts' | 'runKm';
export type Goals = Record<GoalKey, number>;

export type NotificationKey = 'rest' | 'sound' | 'remind' | 'daily' | 'weekly' | 'goals' | 'sync';

export type ProgressPhoto = { id: string; date: string; kg: number };

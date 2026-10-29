import { useAccount } from '@/shared/session';

/** Database defaults (public.goals), shown until the account loads. */
const DEFAULT_GOALS = { steps: 10000, sleepMinutes: 450, workouts: 4, runKm: 15 } as const;

export type HomeGoals = { steps: number; sleepMinutes: number; workouts: number; runKm: number };

/** The signed-in user's goals (Perfil › Metas), as the Home cards read them. */
export function useHomeGoals(): HomeGoals {
  const goals = useAccount().data?.goals;
  if (!goals) return DEFAULT_GOALS;
  return {
    steps: goals.steps,
    sleepMinutes: goals.sleepMinutes,
    workouts: goals.workoutsPerWeek,
    runKm: goals.runKm,
  };
}

/** First letter of the display name for the header avatar. */
export function useUserInitial(): string {
  const name = useAccount().data?.profile.name ?? '';
  return name.trim().charAt(0).toUpperCase();
}

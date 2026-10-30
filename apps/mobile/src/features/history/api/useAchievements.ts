import { achievements, supabase, useQuery } from '@/shared/api';
import { today } from '@/shared/clock';
import { useSession } from '@/shared/session';

/**
 * Badges and the monthly recap, computed on the server from the logged entries as of the app's
 * "today". Keys live under ['history'], so saving or deleting a session refreshes them.
 */
export const achievementKeys = {
  badges: (user: string | undefined, day: string) =>
    ['history', 'achievements', user, day] as const,
  recap: (user: string | undefined, day: string) => ['history', 'recap', user, day] as const,
};

export function useAchievements() {
  const { user } = useSession();
  const day = today();
  return useQuery({
    queryKey: achievementKeys.badges(user?.id, day),
    queryFn: () => achievements.getAchievements(supabase, day),
    enabled: Boolean(user),
  });
}

/** Month-to-date recap of the month containing today. */
export function useMonthlyRecap() {
  const { user } = useSession();
  const day = today();
  return useQuery({
    queryKey: achievementKeys.recap(user?.id, day),
    queryFn: () => achievements.getMonthlyRecap(supabase, day),
    enabled: Boolean(user),
  });
}

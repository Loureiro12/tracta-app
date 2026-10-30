import { achievements, supabase, useQuery } from '@/shared/api';
import { now } from '@/shared/clock';
import { useSession } from '@/shared/session';

import { previousWeekStart } from '../lib/week';

/**
 * Server summary of a Monday–Sunday week (default: the last full week before today) against
 * the week before. Lives under ['history'], so saving a session or a run refreshes it.
 */
export function useWeeklySummary(weekStart: string = previousWeekStart(now())) {
  const { user } = useSession();
  return useQuery({
    queryKey: ['history', 'weekly', user?.id, weekStart],
    queryFn: () => achievements.getWeeklySummary(supabase, weekStart),
    enabled: Boolean(user),
  });
}

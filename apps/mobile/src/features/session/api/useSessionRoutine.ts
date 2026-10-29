import { routines, supabase, useQuery } from '@/shared/api';
import { now } from '@/shared/clock';

import { pickRoutine, weekdayOf } from '../model/session.logic';

/** Query key of the routines as the session reads them (prescription + last sets). */
export const sessionRoutinesKey = ['routines', 'session'] as const;

/**
 * The routine to train for a route param (uuid or letter; none = today's routine), with the
 * previous sets of every exercise. `data` is null when the user has no matching routine.
 */
export function useSessionRoutine(param: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: sessionRoutinesKey,
    queryFn: () => routines.listRoutines(supabase),
    enabled,
    staleTime: 0,
    select: (list) => pickRoutine(list, param, weekdayOf(now())),
  });
}

import { body, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { now, toDateKey } from '@/shared/clock';

import type { body as api } from '@tracta/api';

/** Days shown by the weight chart (today included). */
export const BODY_WINDOW_DAYS = 30;

/** First and last calendar day of the chart window, ending on the app's "today". */
export function bodyWindow(): { from: string; to: string } {
  const end = now();
  const start = new Date(end);
  start.setDate(start.getDate() - (BODY_WINDOW_DAYS - 1));
  return { from: toDateKey(start), to: toDateKey(end) };
}

export const bodyKeys = {
  all: ['body'] as const,
  range: (from: string, to: string) => ['body', 'range', from, to] as const,
  latest: ['body', 'latest'] as const,
};

/** Weigh-ins and measurements of the last 30 days. */
export function useBodyRange() {
  const { from, to } = bodyWindow();
  return useQuery({
    queryKey: bodyKeys.range(from, to),
    queryFn: () => body.listBody(supabase, { from, to }),
  });
}

/** Latest value of each measure (any date). */
export function useLatestBody() {
  return useQuery({ queryKey: bodyKeys.latest, queryFn: () => body.latestBody(supabase) });
}

/** Saves today's manual entry and refreshes the Body segment. */
export function useLogBody() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.LogBodyInput) => body.logBody(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bodyKeys.all }),
  });
}

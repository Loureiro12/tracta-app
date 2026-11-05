import { body, health, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { now, toDateKey } from '@/shared/clock';
import { getHealthSource } from '@/shared/health';

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

/** Best effort: the weigh-in is already saved, so failures are ignored. */
async function writeWeightToHealth(weightKg: number): Promise<void> {
  const connection = await health.getConnection(supabase);
  if (!connection?.writeTypes.includes('body')) return;
  const source = await getHealthSource(connection.source);
  await source?.saveWeight(now(), weightKg);
}

/** Saves today's manual entry, refreshes the Body segment and sends the weight to the Health source. */
export function useLogBody() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.LogBodyInput) => body.logBody(supabase, input),
    onSuccess: (_saved, input) => {
      if (input.weightKg !== undefined) {
        void writeWeightToHealth(input.weightKg).catch(() => undefined);
      }
      return queryClient.invalidateQueries({ queryKey: bodyKeys.all });
    },
  });
}

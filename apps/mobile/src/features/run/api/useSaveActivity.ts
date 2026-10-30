import { activities, health, supabase, useMutation, useQueryClient } from '@/shared/api';
import { getHealthSource } from '@/shared/health';

import type { WorkoutKind } from '@/shared/health';
import type { activities as api } from '@tracta/api';

const HEALTH_KIND: Partial<Record<api.ActivityKind, WorkoutKind>> = { run: 'run', walk: 'walk' };

/**
 * Writes the saved activity back to Apple Health / Health Connect when the user connected it
 * with workout writing on. Best effort: the activity is already saved, so failures are ignored.
 */
async function writeToHealth(input: api.SaveActivityInput): Promise<void> {
  const connection = await health.getConnection(supabase);
  if (!connection?.writeTypes.includes('workouts')) return;
  const source = await getHealthSource();
  if (!source) return;
  const start = new Date(input.startedAt);
  const distance = connection.writeTypes.includes('distance') ? input.distanceM : undefined;
  await source.saveWorkout({
    kind: HEALTH_KIND[input.kind] ?? 'other',
    start,
    end: new Date(start.getTime() + input.durationSeconds * 1000),
    ...(distance ? { distanceM: distance } : {}),
  });
}

/** Saves the finished activity, then refreshes History (calendar, evolution, records). */
export function useSaveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.SaveActivityInput) => activities.saveActivity(supabase, input),
    onSuccess: (_saved, input) => {
      void writeToHealth(input).catch(() => undefined);
      return queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

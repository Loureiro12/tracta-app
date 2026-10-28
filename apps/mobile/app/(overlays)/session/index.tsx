import { useLocalSearchParams } from 'expo-router';

import { SessionScreen } from '@/features/session';

/** `/session?routine=A` (also `routineId=A` from the workouts feature) or `/session?free=1`. */
export default function SessionRoute() {
  const params = useLocalSearchParams<{ routine?: string; routineId?: string; free?: string }>();
  const routine = params.routine ?? params.routineId;
  return (
    <SessionScreen
      routine={typeof routine === 'string' ? routine : undefined}
      free={params.free === '1'}
    />
  );
}

import { useLocalSearchParams } from 'expo-router';

import { RoutineDetailScreen } from '@/features/workouts';

export default function RoutineDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RoutineDetailScreen id={id} />;
}

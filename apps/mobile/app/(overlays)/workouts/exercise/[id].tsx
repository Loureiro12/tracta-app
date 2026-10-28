import { useLocalSearchParams } from 'expo-router';

import { ExerciseDetailScreen } from '@/features/workouts';

export default function ExerciseDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExerciseDetailScreen id={id} />;
}

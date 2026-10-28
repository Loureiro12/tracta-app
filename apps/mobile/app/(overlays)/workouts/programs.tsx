import { useLocalSearchParams } from 'expo-router';

import { ProgramsScreen } from '@/features/workouts';

export default function ProgramsRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <ProgramsScreen id={id} />;
}

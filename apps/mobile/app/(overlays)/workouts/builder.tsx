import { useLocalSearchParams } from 'expo-router';

import { BuilderScreen } from '@/features/workouts';

export default function BuilderRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <BuilderScreen id={id} />;
}

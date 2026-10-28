import { useLocalSearchParams } from 'expo-router';

import { WorkoutsScreen } from '@/features/workouts';

/** `?scenario=new` renders the empty-routines state (demo scenario, like the prototype). */
export default function WorkoutsRoute() {
  const { scenario } = useLocalSearchParams<{ scenario?: string }>();
  return <WorkoutsScreen scenario={scenario === 'new' ? 'new' : 'default'} />;
}

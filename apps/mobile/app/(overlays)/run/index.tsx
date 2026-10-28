import { useLocalSearchParams } from 'expo-router';

import { RunScreen } from '@/features/run';

/** Live activity. Deep link: tracta://run?type=run|walk|bike|swim|…|intervals */
export default function RunRoute() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  return <RunScreen type={type} />;
}

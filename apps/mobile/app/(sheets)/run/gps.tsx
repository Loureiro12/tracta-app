import { useLocalSearchParams } from 'expo-router';

import { GpsAskSheetScreen } from '@/features/run';

/** Location permission prompt. Deep link: tracta://run/gps?type=run */
export default function GpsAskRoute() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  return <GpsAskSheetScreen type={type} />;
}

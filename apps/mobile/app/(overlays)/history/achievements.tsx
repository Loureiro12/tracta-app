import { useLocalSearchParams } from 'expo-router';

import { AchievementsScreen } from '@/features/history';

export default function HistoryAchievementsRoute() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return <AchievementsScreen tab={tab} />;
}

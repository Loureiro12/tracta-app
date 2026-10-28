import { useLocalSearchParams } from 'expo-router';

import { SessionDetailScreen } from '@/features/history';

export default function HistorySessionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SessionDetailScreen id={id} />;
}

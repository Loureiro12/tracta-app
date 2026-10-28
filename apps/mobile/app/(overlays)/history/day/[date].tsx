import { useLocalSearchParams } from 'expo-router';

import { DayScreen } from '@/features/history';

export default function HistoryDayRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();
  return <DayScreen date={date} />;
}

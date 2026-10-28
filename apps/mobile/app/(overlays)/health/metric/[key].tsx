import { useLocalSearchParams } from 'expo-router';

import { MetricDetailScreen } from '@/features/health';

/** Metric detail overlay. Deep link: tracta://health/metric/<steps|hr|cal|dist|sleep|weight> */
export default function MetricDetailRoute() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return <MetricDetailScreen metricKey={key} />;
}

import { useLocalSearchParams } from 'expo-router';

import { HealthScreen } from '@/features/health';

import type { HealthSegment } from '@/features/health';

const SEGMENTS: readonly HealthSegment[] = ['sleep', 'activity', 'body'];

/** Saúde tab. Deep link: tracta://health?tab=sleep|activity|body */
export default function HealthRoute() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initialTab = SEGMENTS.find((s) => s === tab);
  return <HealthScreen initialTab={initialTab} />;
}

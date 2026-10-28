import { useLocalSearchParams } from 'expo-router';

import { ChallengeDetailScreen } from '@/features/social';

export default function ChallengeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChallengeDetailScreen id={id ?? ''} />;
}

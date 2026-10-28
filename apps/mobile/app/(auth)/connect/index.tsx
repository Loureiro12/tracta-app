import { useLocalSearchParams } from 'expo-router';

import { ConnectionsScreen } from '@/features/auth';

/** `/connect?mode=settings` (from Profile) or `/connect?mode=onboarding` (default, after sign-up). */
export default function ConnectRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  return <ConnectionsScreen mode={mode === 'settings' ? 'settings' : 'onboarding'} />;
}

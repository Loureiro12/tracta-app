import { useLocalSearchParams } from 'expo-router';

import { PaywallScreen } from '@/features/profile';

/** `/profile/paywall?context=programs` — the Pro feature that gated the user. */
export default function PaywallRoute() {
  const { context } = useLocalSearchParams<{ context?: string }>();
  return <PaywallScreen {...(context ? { context } : {})} />;
}

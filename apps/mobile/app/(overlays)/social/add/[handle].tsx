import { useLocalSearchParams } from 'expo-router';

import { AddFriendScreen } from '@/features/social';

/** Opened from an invite link: tracta://social/add/<handle>. */
export default function AddFriendRoute() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return <AddFriendScreen handle={handle ?? ''} />;
}

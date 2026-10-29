import { social, supabase, useQuery } from '@/shared/api';
import { today } from '@/shared/clock';

import { socialKeys } from './socialKeys';
import { avatarColor } from '../model/social.constants';

import type { FriendView } from '../model/social.types';

export function toFriendView(f: social.Friend): FriendView {
  return {
    userId: f.id,
    key: f.handle ?? f.id,
    name: f.name,
    color: avatarColor(f.id),
    handle: f.handle ? `@${f.handle}` : '',
    done: f.done === true,
    what: f.what ?? undefined,
    min: f.activeMinutes ?? 0,
    steps: f.steps ?? 0,
    streak: f.streak ?? 0,
  };
}

/** Accepted friends with today's activity (masked by each friend's sharing switches). */
export function useFriends() {
  const day = today();
  return useQuery({
    queryKey: socialKeys.friends(day),
    queryFn: () => social.listFriends(supabase, day),
    select: (rows) => rows.map(toFriendView),
  });
}

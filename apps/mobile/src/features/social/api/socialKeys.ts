/** React Query keys of the Social feature; everything lives under ['social'] for broad invalidation. */
export const socialKeys = {
  all: ['social'] as const,
  friends: (day: string) => ['social', 'friends', day] as const,
  requests: ['social', 'requests'] as const,
  suggestions: ['social', 'suggestions'] as const,
  emailInvites: ['social', 'email-invites'] as const,
  cheers: (day: string) => ['social', 'cheers', day] as const,
  challenges: ['social', 'challenges'] as const,
  board: (id: string, day: string) => ['social', 'board', id, day] as const,
};

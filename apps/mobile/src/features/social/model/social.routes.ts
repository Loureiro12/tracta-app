import type { Href } from 'expo-router';

/**
 * Hrefs used by the Social feature. expo-router's typed routes are generated at dev time, so
 * the strings are asserted to `Href` here in one place.
 */
export const socialRoutes = {
  hub: '/social' as Href,
  invite: '/social/invite' as Href,
  newChallenge: '/social/new-challenge' as Href,
  challenge: (id: string): Href => `/social/challenge/${id}` as Href,
  privacy: '/social/privacy' as Href,
  workouts: '/workouts' as Href,
} as const;

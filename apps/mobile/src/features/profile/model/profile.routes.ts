import type { Href } from 'expo-router';

/**
 * Hrefs used by the Profile feature. expo-router's typed routes are generated at dev time, so
 * the strings are asserted to `Href` here in one place.
 */
export const profileRoutes = {
  edit: '/profile/edit' as Href,
  photos: '/profile/photos' as Href,
  notifications: '/profile/notifications' as Href,
  privacy: '/profile/privacy' as Href,
  goals: '/profile/goals' as Href,
  achievements: '/history/achievements' as Href,
  social: '/social' as Href,
  tour: '/tour' as Href,
  connections: '/connect?mode=settings' as Href,
  appSettings: '/settings' as Href,
  welcome: '/welcome' as Href,
} as const;

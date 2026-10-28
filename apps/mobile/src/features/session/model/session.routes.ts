import type { Href } from 'expo-router';

/** Typed routes are generated at `expo start`; hrefs are built as strings so tsc stays green. */
const href = (path: string): Href => path as Href;

/** Navigation targets of the session feature (route groups are omitted from hrefs). */
export const sessionRoutes = {
  home: () => href('/'),
  session: (routineId?: string) => href(routineId ? `/session?routine=${routineId}` : '/session'),
  rest: () => href('/session/rest'),
  summary: () => href('/session/summary'),
  plates: () => href('/session/plates'),
  recover: () => href('/session/recover'),
};

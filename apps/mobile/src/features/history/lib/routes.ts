import type { Href } from 'expo-router';

/**
 * Typed routes come from `.expo/types/router.d.ts`, which `expo start` regenerates; until the lead
 * runs it the History overlays (and the other features' routes) are unknown to the type, so hrefs
 * are built here and cast once.
 */
export function href(path: string): Href {
  return path as Href;
}

export const historyHrefs = {
  tab: href('/history'),
  recap: href('/history/recap'),
  achievements: (tab?: 'records' | 'badges') =>
    href(tab ? `/history/achievements?tab=${tab}` : '/history/achievements'),
  session: (id: string) => href(`/history/session/${id}`),
  day: (date: string) => href(`/history/day/${date}`),
  share: (template: string) => href(`/share?template=${template}`),
  report: (range: string) => href(`/health/report?range=${range}`),
  startSession: href('/session'),
} as const;

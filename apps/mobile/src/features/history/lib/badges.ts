/** Presentation of the server badges (rules live in the `achievements` RPC, docs/BACKEND.md). */
import type { achievements } from '@tracta/api';

export type BadgeTone = 'brand' | 'ink' | 'run' | 'danger' | 'sleep';

/** Mark drawn in the tile and its color once earned. */
export const BADGE_STYLE: Record<achievements.BadgeId, { mark: string; tone: BadgeTone }> = {
  streak12: { mark: '12', tone: 'brand' },
  workouts50: { mark: '50', tone: 'ink' },
  first5k: { mark: '5K', tone: 'run' },
  oneTon: { mark: '1t', tone: 'danger' },
  perfectMonth: { mark: '4/4', tone: 'sleep' },
  tenKSub55: { mark: '10K', tone: 'run' },
  streak30: { mark: '30', tone: 'brand' },
  workouts100: { mark: '100', tone: 'ink' },
};

/** Pairs of badges for the two-column grid. */
export function badgeRows<T>(items: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

import type { notifications } from '@tracta/api';
import type { SemanticColors } from '@tracta/design-system';

export type InboxGroupId = 'today' | 'week' | 'earlier';
export const inboxGroups: readonly InboxGroupId[] = ['today', 'week', 'earlier'];

type KindStyle = { iconBg: keyof SemanticColors; iconColor: keyof SemanticColors };

/** Icon tint per notification kind (prototype `stateVals().ALL`). */
export const kindStyles: Record<notifications.NotificationKind, KindStyle> = {
  workout: { iconBg: 'brandTint', iconColor: 'brandText' },
  social: { iconBg: 'socialBg', iconColor: 'social' },
  sync: { iconBg: 'warnBg', iconColor: 'warnText' },
  weekly: { iconBg: 'fill1', iconColor: 'text' },
  record: { iconBg: 'brandTint', iconColor: 'danger' },
  goal: { iconBg: 'brandTint', iconColor: 'brandText' },
};

const FIXED_LETTERS: Partial<Record<notifications.NotificationKind, string>> = {
  sync: '!',
  weekly: 'S',
  record: 'R',
  goal: 'M',
};

/**
 * Letter of the 36px icon: the routine label for workout reminders ("… Treino A" → A), the
 * sender's initial for social items, a fixed glyph for the other kinds.
 */
export function letterFor(n: notifications.Notification): string {
  const fixed = FIXED_LETTERS[n.kind];
  if (fixed) return fixed;
  const title = n.title.trim();
  if (n.kind === 'workout') return /\s([A-Z])$/.exec(title)?.[1] ?? 'T';
  return (title[0] ?? '·').toUpperCase();
}

/** Today / last 7 days / earlier, against the app's "today" (YYYY-MM-DD, local). */
export function groupOf(
  createdAt: Date,
  todayKey: string,
  toKey: (d: Date) => string,
): InboxGroupId {
  const key = toKey(createdAt);
  if (key === todayKey) return 'today';
  const [y, m, d] = todayKey.split('-').map(Number);
  const weekAgo = toKey(new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) - 7));
  return key > weekAgo ? 'week' : 'earlier';
}

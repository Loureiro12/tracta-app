import type { SemanticColors } from '@tracta/design-system';

export type InboxItemId = 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6';
export type InboxGroupId = 'today' | 'week';

export type InboxItem = {
  id: InboxItemId;
  group: InboxGroupId;
  /** Letter shown in the 36px rounded icon. */
  letter: string;
  iconBg: keyof SemanticColors;
  iconColor: keyof SemanticColors;
  /** Route opened when the notification is tapped. */
  href: '/workouts' | '/social' | '/health' | '/home/weekly' | '/history';
};

/** Notification center mock (prototype `stateVals().ALL`). Copy lives in i18n under `items.<id>`. */
export const inboxItems: readonly InboxItem[] = [
  {
    id: 'n1',
    group: 'today',
    letter: 'A',
    iconBg: 'brandTint',
    iconColor: 'brandText',
    href: '/workouts',
  },
  {
    id: 'n2',
    group: 'today',
    letter: 'M',
    iconBg: 'socialBg',
    iconColor: 'social',
    href: '/social',
  },
  {
    id: 'n3',
    group: 'today',
    letter: '!',
    iconBg: 'warnBg',
    iconColor: 'warnText',
    href: '/health',
  },
  {
    id: 'n4',
    group: 'week',
    letter: 'S',
    iconBg: 'fill1',
    iconColor: 'text',
    href: '/home/weekly',
  },
  {
    id: 'n5',
    group: 'week',
    letter: 'R',
    iconBg: 'brandTint',
    iconColor: 'danger',
    href: '/history',
  },
  {
    id: 'n6',
    group: 'week',
    letter: 'M',
    iconBg: 'brandTint',
    iconColor: 'brandText',
    href: '/health',
  },
];

export const inboxGroups: readonly InboxGroupId[] = ['today', 'week'];

import { Platform } from 'react-native';

import type { WidgetEntry, WidgetProps } from './widgets.types';

type Timeline<P> = { updateTimeline: (entries: { date: Date; props: P }[]) => void };
type Widgets = { [K in keyof WidgetProps]: Timeline<WidgetProps[K]> };

let widgets: Widgets | null | undefined;

/**
 * The layouts register the widgets with the native module when loaded, so they are only loaded
 * on iOS (Android widgets are not set up) and never break the app if the module is missing.
 */
function load(): Widgets | null {
  if (widgets !== undefined) return widgets;
  if (Platform.OS !== 'ios') return (widgets = null);
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    widgets = {
      week: require('../../../widgets/TractaWeek').default,
      today: require('../../../widgets/TractaToday').default,
      streak: require('../../../widgets/TractaStreak').default,
      race: require('../../../widgets/TractaRace').default,
      summary: require('../../../widgets/TractaSummary').default,
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
  } catch {
    widgets = null;
  }
  return widgets;
}

/** Hands each widget its own slice of the timeline; WidgetKit shows each entry from its date on. */
export function publishWidgets(entries: readonly WidgetEntry[]): void {
  const w = load();
  if (!w || entries.length === 0) return;
  for (const key of Object.keys(w) as (keyof WidgetProps)[]) {
    // One at a time: a widget that can't be updated must not leave the others stale.
    try {
      (w[key] as Timeline<unknown>).updateTimeline(
        entries.map((e) => ({ date: e.date, props: e.props[key] })),
      );
    } catch (error) {
      if (__DEV__) console.warn(`[widgets] ${key} was not updated`, error);
    }
  }
}

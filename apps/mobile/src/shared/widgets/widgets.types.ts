/**
 * What each home/lock screen widget shows. The widget layouts (apps/mobile/widgets) run in an
 * isolated runtime with no i18n or data access, so every string arrives here already translated
 * and formatted.
 */

/** Shared by every widget: signed out, they only invite the user back. */
type Base = {
  signedIn: boolean;
  /** Shown instead of the content when signed out. */
  signedOutText: string;
  /** Opened when the widget is tapped. */
  url: string;
};

export type WeekDay = {
  /** One-letter weekday ("S", "T"…). */
  weekday: string;
  /** Routine letter, "⟶" for a run or "—" for rest. */
  plan: string;
  done: boolean;
  today: boolean;
};

/** Medium home widget and the circular ring on the Lock Screen. */
export type WeekWidgetProps = Base & {
  title: string;
  /** "3 de 4 · 18 km" */
  progress: string;
  done: number;
  goal: number;
  /** Under the ring: "treinos". */
  ringLabel: string;
  days: WeekDay[];
  /** "Próximo: Treino A hoje · Corrida qua"; empty when nothing is planned. */
  next: string;
};

/** Small home widget and the inline line above the clock. */
export type TodayWidgetProps = Base & {
  heading: string;
  /** Reminder time ("18:30"); empty when reminders are off. */
  time: string;
  /** Routine letter, "⟶" for a run, empty on a free day. */
  badge: string;
  title: string;
  meta: string;
  /** Hidden while the device is locked (steps on a free day). */
  metaIsPrivate: boolean;
  /** Lock Screen line: "Treino A às 18:30". */
  inline: string;
};

export type StreakWidgetProps = Base & {
  days: number;
  label: string;
};

export type RaceWidgetProps = Base & {
  hasRace: boolean;
  title: string;
  /** "faltam 40 dias" */
  countdown: string;
  /** "ritmo-alvo 5:30 /km" */
  pace: string;
};

export type SummaryMetric = {
  label: string;
  value: string;
  /** 0…1 of the daily goal. */
  progress: number;
};

export type SummaryStat = { label: string; value: string };

/** Large home widget. Sleep and steps are hidden while the device is locked. */
export type SummaryWidgetProps = Base & {
  title: string;
  updated: string;
  sleep: SummaryMetric;
  steps: SummaryMetric;
  /** Never null: the widget store can't hold null, so `hasRace` says whether to show it. */
  hasRace: boolean;
  race: { title: string; countdown: string; stats: SummaryStat[] };
  noRace: string;
  start: { label: string; url: string };
  run: { label: string; url: string };
};

export type WidgetProps = {
  week: WeekWidgetProps;
  today: TodayWidgetProps;
  streak: StreakWidgetProps;
  race: RaceWidgetProps;
  summary: SummaryWidgetProps;
};

/** One timeline entry: what to show from `date` on (the next entry's date ends it). */
export type WidgetEntry = { date: Date; props: WidgetProps };

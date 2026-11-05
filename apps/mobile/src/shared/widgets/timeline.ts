import { toDateKey } from '@/shared/clock';

import type { SummaryMetric, WeekDay, WidgetEntry, WidgetProps } from './widgets.types';

/** Plan token of a run day and of a rest day (same as the Workouts strip). */
export const RUN_TOKEN = '⟶';
export const REST_TOKEN = '—';

/** Days of content scheduled ahead: the widgets stay right for a week without opening the app. */
const DAYS_AHEAD = 7;

export type WidgetRoutine = {
  id: string;
  label: string;
  name: string;
  focus: string;
  exercises: number;
  estMinutes: number;
};

export type WidgetInput = {
  signedIn: boolean;
  /** The app clock's now (E2E freezes the date). */
  appNow: Date;
  /** The device's real now: timeline entries are scheduled in real time. */
  realNow: Date;
  /** Logged entries of the last weeks (only what happened up to today). */
  entries: readonly { startedAt: string; kind: string; distanceM: number | null }[];
  weeklyGoal: number;
  /** Plan of each weekday, Monday first: routine letter, RUN_TOKEN or REST_TOKEN. */
  plan: readonly string[];
  routines: readonly WidgetRoutine[];
  /** Daily training reminder (Perfil › Notificações), in minutes after midnight. */
  reminderMinutes: number | null;
  /** Consecutive active days up to today (or yesterday when today has nothing yet). */
  streak: number;
  race: { distanceKm: number; label: string; daysLeft: number; goalSeconds: number } | null;
  /** Today's synced numbers; null without a Health connection. */
  health: { sleepMinutes: number | null; steps: number | null } | null;
  goals: { steps: number; sleepMinutes: number };
};

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export type WidgetFormat = {
  number: (value: number) => string;
  /** Short weekday without punctuation ("qua", "Wed"). */
  weekdayShort: (date: Date) => string;
  /** One letter per weekday, Monday first. */
  weekdayLetters: readonly string[];
  dayMonth: (date: Date) => string;
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

/** 0 = Monday … 6 = Sunday. */
const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

const clock = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
};

const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * What every widget shows from today on, one entry per day for a week: the week, the plan of the
 * day, the streak and the race countdown change at midnight even if the app stays closed.
 */
export function buildWidgetTimeline(
  input: WidgetInput,
  t: Translate,
  format: WidgetFormat,
): WidgetEntry[] {
  const entries: WidgetEntry[] = [];
  for (let offset = 0; offset < DAYS_AHEAD; offset += 1) {
    // The first entry starts now; the others at the device's next midnights.
    const date = offset === 0 ? input.realNow : addDays(input.realNow, offset);
    entries.push({ date, props: propsFor(input, offset, t, format) });
  }
  return entries;
}

function propsFor(
  input: WidgetInput,
  offset: number,
  t: Translate,
  format: WidgetFormat,
): WidgetProps {
  const day = addDays(input.appNow, offset);
  const dayKey = toDateKey(day);
  const weekStart = addDays(day, -weekdayIndex(day));
  const todayIndex = weekdayIndex(day);
  const base = { signedIn: input.signedIn, signedOutText: t('widgets.signedOut') };

  const doneDays = new Set<string>();
  let weekDone = 0;
  let weekRunM = 0;
  for (const e of input.entries) {
    const at = new Date(e.startedAt);
    const key = toDateKey(at);
    if (at >= weekStart && key <= dayKey) {
      weekDone += 1;
      doneDays.add(key);
      if (e.kind === 'run') weekRunM += e.distanceM ?? 0;
    }
  }
  const doneToday = doneDays.has(dayKey);

  const routineOf = (token: string) => input.routines.find((r) => r.label === token) ?? null;
  const planned = input.plan[todayIndex] ?? REST_TOKEN;
  const routine = routineOf(planned);
  const time = input.reminderMinutes == null ? '' : hhmm(input.reminderMinutes);
  const isToday = offset === 0;

  // ---- Week
  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return {
      weekday: format.weekdayLetters[i] ?? '',
      plan: input.plan[i] ?? REST_TOKEN,
      done: doneDays.has(toDateKey(d)),
      today: i === todayIndex,
    };
  });
  const nextItems: string[] = [];
  for (let k = 0; k < 7 && nextItems.length < 2; k += 1) {
    const d = addDays(day, k);
    const token = input.plan[weekdayIndex(d)] ?? REST_TOKEN;
    if (token === REST_TOKEN || (k === 0 && doneToday)) continue;
    const what =
      token === RUN_TOKEN
        ? t('widgets.run')
        : (routineOf(token)?.name ?? t('widgets.workout', { label: token }));
    const when =
      k === 0
        ? t('widgets.when.today')
        : k === 1
          ? t('widgets.when.tomorrow')
          : format.weekdayShort(d);
    nextItems.push(`${what} ${when}`);
  }
  const km = Math.round(weekRunM / 1000);
  const week = {
    ...base,
    url: 'tracta://workouts',
    title: t('widgets.week.title'),
    progress:
      km > 0
        ? t('widgets.week.progressKm', { done: weekDone, goal: input.weeklyGoal, km })
        : t('widgets.week.progress', { done: weekDone, goal: input.weeklyGoal }),
    done: weekDone,
    goal: input.weeklyGoal,
    ringLabel: t('widgets.week.ring', { count: input.weeklyGoal }),
    days,
    next: nextItems.length ? t('widgets.week.next', { items: nextItems.join(' · ') }) : '',
  };

  // ---- Today
  const steps = isToday ? (input.health?.steps ?? null) : null;
  let today: WidgetProps['today'];
  if (doneToday) {
    today = {
      ...base,
      url: 'tracta://history',
      heading: t('widgets.today.heading'),
      time: '',
      badge: '✓',
      title: t('widgets.today.doneTitle'),
      meta: t('widgets.today.doneMeta', { count: weekDone, goal: input.weeklyGoal }),
      metaIsPrivate: false,
      inline: t('widgets.today.inlineDone'),
    };
  } else if (planned === RUN_TOKEN) {
    today = {
      ...base,
      url: 'tracta://run?type=run',
      heading: t('widgets.today.heading'),
      time,
      badge: RUN_TOKEN,
      title: t('widgets.run'),
      meta: t('widgets.today.runMeta'),
      metaIsPrivate: false,
      inline: time
        ? t('widgets.today.inlineAt', { what: t('widgets.run'), time })
        : t('widgets.run'),
    };
  } else if (planned !== REST_TOKEN) {
    const name = routine?.name ?? t('widgets.workout', { label: planned });
    today = {
      ...base,
      url: routine ? `tracta://session?routineId=${routine.id}` : 'tracta://session',
      heading: t('widgets.today.heading'),
      time,
      badge: planned,
      title: routine?.focus || name,
      meta: routine
        ? t('widgets.today.meta', { count: routine.exercises, minutes: routine.estMinutes })
        : '',
      metaIsPrivate: false,
      inline: time ? t('widgets.today.inlineAt', { what: name, time }) : name,
    };
  } else {
    today = {
      ...base,
      url: 'tracta://',
      heading: t('widgets.today.heading'),
      time: '',
      badge: '',
      title: t('widgets.today.free'),
      meta: steps == null ? '' : t('widgets.today.steps', { steps: format.number(steps) }),
      metaIsPrivate: true,
      inline: t('widgets.today.free'),
    };
  }

  // ---- Streak: it survives tomorrow only if today counts; later days start over.
  const streakDays = offset === 0 ? input.streak : offset === 1 && doneToday ? input.streak : 0;
  const streak = {
    ...base,
    url: 'tracta://history',
    days: streakDays,
    label: t('widgets.streak.label', { count: streakDays }),
  };

  // ---- Race
  const race = input.race;
  const daysLeft = race ? race.daysLeft - offset : -1;
  const hasRace = race != null && daysLeft >= 0;
  const raceTitle = race ? t('widgets.race.title', { label: race.label }) : '';
  const countdown = !hasRace
    ? ''
    : daysLeft === 0
      ? t('widgets.race.today')
      : t('widgets.race.countdown', { count: daysLeft });
  const pace = race ? `${clock(race.goalSeconds / race.distanceKm)} /km` : '';
  const raceProps = {
    ...base,
    url: 'tracta://workouts',
    hasRace,
    title: hasRace ? raceTitle : t('widgets.race.none'),
    countdown: hasRace ? countdown : t('widgets.race.noneHint'),
    pace: hasRace ? t('widgets.race.pace', { pace }) : '',
  };

  // ---- Summary (today's health numbers only make sense today)
  const sleepMinutes = isToday ? (input.health?.sleepMinutes ?? null) : null;
  const metric = (label: string, value: string | null, progress: number): SummaryMetric => ({
    label,
    value: value ?? '—',
    progress: value == null ? 0 : Math.min(1, Math.max(0, progress)),
  });
  const raceDate = race ? addDays(input.appNow, race.daysLeft) : null;
  const startLabel =
    planned !== REST_TOKEN && planned !== RUN_TOKEN && !doneToday
      ? t('widgets.summary.start', {
          name: routine?.name ?? t('widgets.workout', { label: planned }),
        })
      : t('widgets.summary.startFree');
  const summary = {
    ...base,
    url: 'tracta://',
    title: t('widgets.summary.title'),
    updated: t('widgets.summary.updated', {
      time: `${String(input.realNow.getHours()).padStart(2, '0')}:${String(input.realNow.getMinutes()).padStart(2, '0')}`,
    }),
    sleep: metric(
      t('widgets.summary.sleep'),
      sleepMinutes == null
        ? null
        : t('widgets.summary.sleepValue', {
            hours: Math.floor(sleepMinutes / 60),
            minutes: String(sleepMinutes % 60).padStart(2, '0'),
          }),
      sleepMinutes == null ? 0 : sleepMinutes / input.goals.sleepMinutes,
    ),
    steps: metric(
      t('widgets.summary.steps'),
      steps == null ? null : format.number(steps),
      steps == null ? 0 : steps / input.goals.steps,
    ),
    hasRace: hasRace && race != null && raceDate != null,
    race:
      hasRace && race && raceDate
        ? {
            title: t('widgets.summary.raceTitle', {
              label: race.label,
              date: format.dayMonth(raceDate),
            }),
            countdown:
              daysLeft === 0
                ? t('widgets.race.today')
                : t('widgets.summary.days', { count: daysLeft }),
            stats: [
              { label: t('widgets.summary.target'), value: pace },
              { label: t('widgets.summary.goal'), value: clock(race.goalSeconds) },
            ],
          }
        : { title: '', countdown: '', stats: [] },
    noRace: t('widgets.race.none'),
    start: {
      label: startLabel,
      url:
        routine && !doneToday && planned !== RUN_TOKEN
          ? `tracta://session?routineId=${routine.id}`
          : 'tracta://session?free=1',
    },
    run: { label: t('widgets.run'), url: 'tracta://run?type=run' },
  };

  return { week, today, streak, race: raceProps, summary };
}

/** Every widget's signed-out state: nothing from the last account stays on the screen. */
export function signedOutTimeline(
  t: Translate,
  realNow: Date,
  format: WidgetFormat,
): WidgetEntry[] {
  return buildWidgetTimeline(
    {
      signedIn: false,
      appNow: realNow,
      realNow,
      entries: [],
      weeklyGoal: 0,
      plan: Array<string>(7).fill(REST_TOKEN),
      routines: [],
      reminderMinutes: null,
      streak: 0,
      race: null,
      health: null,
      goals: { steps: 1, sleepMinutes: 1 },
    },
    t,
    format,
  ).slice(0, 1);
}

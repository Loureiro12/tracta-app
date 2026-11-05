import { useEffect, useMemo, useRef, useState } from 'react';

import { AppState } from 'react-native';

import { useMonthlyRecap } from '@/features/history';
import { useHomeGoals, useHomeHealth, useRecentEntries } from '@/features/home';
import { raceDays, useEnrollment, useRace, useRoutines, weekPlan } from '@/features/workouts';
import { now } from '@/shared/clock';
import { formatDate, formatNumber, useTranslation } from '@/shared/i18n';
import { useAccount, useSession } from '@/shared/session';
import { buildWidgetTimeline, publishWidgets, signedOutTimeline } from '@/shared/widgets';

import type { Translate, WidgetEntry, WidgetFormat, WidgetInput } from '@/shared/widgets';

/** Monday-first reference week (2024-01-01 was a Monday) to name the weekdays in the locale. */
const MONDAY = new Date(2024, 0, 1);

/** Everything but the "updated" time: publishing again only when what the widgets show changed. */
function signature(entries: readonly WidgetEntry[]): string {
  return JSON.stringify(
    entries.map((e) => ({ ...e.props, summary: { ...e.props.summary, updated: '' } })),
  );
}

/**
 * Keeps the Home and Lock Screen widgets (iOS) in step with the app: whenever the week, the plan,
 * the race, the streak or today's health numbers change, and when the app returns to the
 * foreground. Signed out, every widget forgets the previous account.
 */
export function WidgetSync() {
  const { t: translate, i18n } = useTranslation('common');
  // Keys are built from the widget's state, so they are checked by the namespace at runtime.
  const t = useMemo<Translate>(
    () => (key, options) => String(translate(key as never, options as never)),
    [translate],
  );
  const { status, user } = useSession();
  const signedIn = Boolean(user);
  // While the session loads, the widgets keep what they show.
  const signedOut = status === 'signedOut';
  const account = useAccount().data;
  const goals = useHomeGoals();
  const recent = useRecentEntries().data;
  const routines = useRoutines().data;
  const { program } = useEnrollment();
  const race = useRace().data;
  const recap = useMonthlyRecap().data;
  const health = useHomeHealth();
  const lastPublished = useRef('');
  // The day changes while the app sleeps in the background: foregrounding rebuilds the timeline.
  const [foregroundedAt, setForegroundedAt] = useState(() => Date.now());

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegroundedAt(Date.now());
    });
    return () => sub.remove();
  }, []);

  const format = useMemo<WidgetFormat>(
    () => ({
      number: (value) => formatNumber(value),
      weekdayShort: (date) => formatDate(date, { weekday: 'short' }).replace('.', ''),
      weekdayLetters: Array.from({ length: 7 }, (_, i) =>
        formatDate(new Date(2024, 0, MONDAY.getDate() + i), { weekday: 'narrow' }).toUpperCase(),
      ),
      dayMonth: (date) => formatDate(date, { day: 'numeric', month: 'short' }).replace('.', ''),
    }),
    // A language switch renames the weekdays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );

  const ready = signedIn && account != null && recent != null && routines != null;

  useEffect(() => {
    let entries: WidgetEntry[];
    if (signedOut) {
      entries = signedOutTimeline(t, new Date(), format);
    } else if (!ready) {
      return;
    } else {
      const input: WidgetInput = {
        signedIn: true,
        appNow: now(),
        realNow: new Date(),
        entries: recent,
        weeklyGoal: goals.workouts,
        plan: weekPlan(routines, program),
        routines: routines.map((r) => ({
          id: r.id,
          label: r.label,
          name: r.name,
          focus: r.focus,
          exercises: r.exercises.length,
          estMinutes: r.estMinutes,
        })),
        reminderMinutes: account.settings.notifications.remind
          ? account.settings.reminderMinutes
          : null,
        streak: recap?.streakDays ?? 0,
        race: race
          ? {
              distanceKm: race.km,
              label: t('widgets.race.distance', { km: race.distance }),
              daysLeft: raceDays(race),
              goalSeconds: race.goal,
            }
          : null,
        health: health.connected
          ? { sleepMinutes: health.sleep?.minutes ?? null, steps: health.move?.steps ?? null }
          : null,
        goals: { steps: goals.steps, sleepMinutes: goals.sleepMinutes },
      };
      entries = buildWidgetTimeline(input, t, format);
    }
    const sig = signature(entries);
    if (sig === lastPublished.current) return;
    lastPublished.current = sig;
    publishWidgets(entries);
  }, [
    signedOut,
    ready,
    account,
    goals,
    recent,
    routines,
    program,
    race,
    recap,
    health.connected,
    health.sleep?.minutes,
    health.move?.steps,
    t,
    format,
    foregroundedAt,
  ]);

  return null;
}

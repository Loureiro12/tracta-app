import { useMemo } from 'react';

import { useHealthRange } from '@/features/health';
import { now, toDateKey } from '@/shared/clock';
import { formatDate, formatNumber, useTranslation } from '@/shared/i18n';
import { useAccount } from '@/shared/session';

import { clock, hoursMinutes } from '../lib/format';
import { parseDateKey } from '../lib/month';
import { sleepRecap } from '../lib/sleepRecap';

import type { achievements } from '@tracta/api';

export type RecapSlide = {
  bg: 'ink' | 'brand' | 'bg' | 'danger' | 'sleep';
  /** Light text on a dark background. */
  light: boolean;
  kicker: string;
  big: string;
  title: string;
  rows: { label: string; value: string }[];
};

const WEEKDAY_KEYS = [
  'recap.weekdays.0',
  'recap.weekdays.1',
  'recap.weekdays.2',
  'recap.weekdays.3',
  'recap.weekdays.4',
  'recap.weekdays.5',
  'recap.weekdays.6',
] as const;

const one = (value: number) => formatNumber(value, { maximumFractionDigits: 1 });

/** Month name ("October") of a YYYY-MM-DD key, in the current locale. */
export function monthName(key: string, withYear = false): string {
  const date = parseDateKey(key) ?? new Date();
  return formatDate(date, withYear ? { month: 'long', year: 'numeric' } : { month: 'long' });
}

/** First day (YYYY-MM-DD) of the month of `date`, `offset` months away. */
function monthStart(date: Date, offset = 0): string {
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + offset, 1));
}

/**
 * The five recap stories: four from the server recap, the sleep story from the synced health
 * days (this month up to today against the whole previous month).
 */
export function useRecapSlides(recap: achievements.MonthlyRecap | undefined): RecapSlide[] {
  const { t } = useTranslation('history');
  const today = now();
  const thisMonth = monthStart(today);
  const days = useHealthRange(monthStart(today, -1), toDateKey(today)).data;
  const sleepGoal = useAccount().data?.goals.sleepMinutes ?? 450;
  return useMemo(() => {
    const sleep = sleepRecap(
      (days ?? []).filter((d) => d.day >= thisMonth),
      (days ?? []).filter((d) => d.day < thisMonth),
      sleepGoal,
    );
    const none = t('recap.none');
    const r = recap;
    const month = r ? monthName(r.month) : none;
    const previousKey = r
      ? (() => {
          const d = parseDateKey(r.month) ?? new Date();
          d.setMonth(d.getMonth() - 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        })()
      : null;
    const diff = r ? r.workouts - r.previousWorkouts : 0;
    const titleArgs = {
      count: Math.abs(diff),
      previous: previousKey ? monthName(previousKey) : none,
    };
    const runKm = r ? r.runDistanceM / 1000 : 0;
    const pace = r && runKm > 0 ? clock(r.runSeconds / runKm) : null;
    const weekday =
      r && r.favoriteWeekday !== null
        ? t(WEEKDAY_KEYS[r.favoriteWeekday] ?? WEEKDAY_KEYS[0])
        : none;

    return [
      {
        bg: 'ink',
        light: true,
        kicker: t('recap.slides.0.kicker', { month }),
        big: r ? String(r.workouts) : none,
        title:
          diff > 0
            ? t('recap.slides.0.titleMore', titleArgs)
            : diff < 0
              ? t('recap.slides.0.titleFewer', titleArgs)
              : t('recap.slides.0.titleSame', titleArgs),
        rows: [
          {
            label: t('recap.slides.0.strength'),
            value: t('recap.slides.0.strengthValue', { count: r?.strengthSessions ?? 0 }),
          },
          {
            label: t('recap.slides.0.running'),
            value: t('recap.slides.0.runningValue', { count: r?.runs ?? 0 }),
          },
          { label: t('recap.slides.0.favorite'), value: weekday },
        ],
      },
      {
        bg: 'brand',
        light: true,
        kicker: t('recap.slides.1.kicker'),
        big: t('recap.km', { value: one(runKm) }),
        title: t('recap.slides.1.title', { count: r?.runs ?? 0 }),
        rows: [
          {
            label: t('recap.slides.1.pace'),
            value: pace ? t('recap.slides.1.paceValue', { pace }) : none,
          },
          {
            label: t('recap.slides.1.longest'),
            value: r?.longestRunM ? t('recap.km', { value: one(r.longestRunM / 1000) }) : none,
          },
          {
            label: t('recap.slides.1.best5k'),
            value: r?.best5kSeconds ? clock(r.best5kSeconds) : none,
          },
        ],
      },
      {
        bg: 'bg',
        light: false,
        kicker: t('recap.slides.2.kicker'),
        big: t('recap.tons', { value: one((r?.volumeKg ?? 0) / 1000) }),
        title: r?.topExercise
          ? t('recap.slides.2.title', { exercise: r.topExercise })
          : t('recap.slides.2.titleNone'),
        rows: [
          { label: t('recap.slides.2.focus'), value: r?.topFocus ?? none },
          { label: t('recap.slides.2.sets'), value: r ? formatNumber(r.sets) : none },
          {
            label: t('recap.slides.2.duration'),
            value: r?.avgStrengthSeconds
              ? t('recap.slides.2.durationValue', {
                  minutes: Math.round(r.avgStrengthSeconds / 60),
                })
              : none,
          },
        ],
      },
      {
        bg: 'danger',
        light: true,
        kicker: t('recap.slides.3.kicker'),
        big: r ? String(r.records.length) : none,
        title: t('recap.slides.3.title'),
        rows: r?.records.length
          ? r.records.slice(0, 3).map((rec) => ({
              label: rec.name,
              value:
                rec.kg === null
                  ? t('recap.slides.3.valueBodyweight', { reps: rec.reps })
                  : t('recap.slides.3.value', { kg: one(rec.kg), reps: rec.reps }),
            }))
          : [{ label: t('recap.slides.3.empty'), value: '' }],
      },
      {
        bg: 'sleep',
        light: true,
        kicker: t('recap.slides.4.kicker'),
        big: sleep.averageMinutes === null ? none : hoursMinutes(sleep.averageMinutes),
        title:
          sleep.averageMinutes === null
            ? t('recap.slides.4.titleNone')
            : sleep.deltaMinutes === null || sleep.deltaMinutes === 0
              ? t('recap.slides.4.titleSame')
              : sleep.deltaMinutes > 0
                ? t('recap.slides.4.title', { minutes: sleep.deltaMinutes })
                : t('recap.slides.4.titleLess', { minutes: -sleep.deltaMinutes }),
        rows: [
          {
            label: t('recap.slides.4.nights'),
            value: t('recap.slides.4.nightsValue', {
              done: sleep.nightsOnTarget,
              total: sleep.nights,
            }),
          },
          { label: t('recap.slides.4.bedtime'), value: sleep.bedtime ?? none },
          {
            label: t('recap.slides.4.streak'),
            value: t('recap.slides.4.streakValue', { count: r?.streakDays ?? 0 }),
          },
        ],
      },
    ];
  }, [recap, t, days, thisMonth, sleepGoal]);
}

import { useMemo } from 'react';

import { monthName, useMonthlyRecap } from '@/features/history';
import { useWeekRange, useWeeklySummary, previousWeekStart } from '@/features/home';
import { now } from '@/shared/clock';
import { formatNumber, useTranslation } from '@/shared/i18n';

import { evoBarHeights, evoMock, runMock, splitBarHeights, todayMock } from '../model/share.mock';

import type { ShareOption, ShareTemplate } from '../model/share.mock';

export type CardRow = { key: string; label: string; value: string };
export type CardBar = { height: number; active: boolean; label: string };
export type CardDot = { active: boolean; label: string };
export type CardContent = {
  kicker: string;
  big: string;
  line: string;
  rows: CardRow[];
  bars: CardBar[] | null;
  dots: CardDot[] | null;
};

const monthKeys = [
  'card.months.m0',
  'card.months.m1',
  'card.months.m2',
  'card.months.m3',
  'card.months.m4',
  'card.months.m5',
] as const;
const weekdayKeys = [
  'card.weekdays.d0',
  'card.weekdays.d1',
  'card.weekdays.d2',
  'card.weekdays.d3',
  'card.weekdays.d4',
  'card.weekdays.d5',
  'card.weekdays.d6',
] as const;

const one = (value: number) => formatNumber(value, { maximumFractionDigits: 1 });

/** First day (YYYY-MM-DD) of the month before the one starting on `monthKey`. */
function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y ?? 1970, (m ?? 1) - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Builds the card copy for a template honouring the "show loads / times" options (prototype `C`).
 * Week, month and record cards (and the evolution streak) read the server summaries; the
 * today/run cards and the evolution chart are still mocks.
 */
export function useShareCardContent(
  template: ShareTemplate,
  options: Record<ShareOption, boolean>,
): CardContent {
  const { t } = useTranslation('share');
  const { loads, times } = options;
  const weekStart = previousWeekStart(now());
  const week = useWeeklySummary(weekStart).data;
  const weekRange = useWeekRange(weekStart);
  const recap = useMonthlyRecap().data;

  return useMemo<CardContent>(() => {
    switch (template) {
      case 'today': {
        const d = todayMock;
        return {
          kicker: t('card.today.name'),
          big: times ? d.duration : t('card.today.bigSets', { count: d.sets }),
          line: d.prs > 0 ? t('card.today.linePr', { count: d.prs }) : t('card.today.lineNoPr'),
          rows: [
            { key: 'sets', label: t('card.today.sets'), value: String(d.sets) },
            ...(loads
              ? [
                  {
                    key: 'volume',
                    label: t('card.today.volume'),
                    value: t('card.tons', { value: one(d.volumeTons) }),
                  },
                ]
              : []),
            {
              key: 'week',
              label: t('card.today.week'),
              value: t('card.today.weekValue', { done: d.weekDone, goal: d.weekGoal }),
            },
          ],
          bars: null,
          dots: null,
        };
      }
      case 'evo': {
        const d = evoMock;
        const heights = evoBarHeights(d.maxKgByMonth);
        const first = d.maxKgByMonth[0] ?? 0;
        const last = d.maxKgByMonth[d.maxKgByMonth.length - 1] ?? 0;
        return {
          kicker: t('card.evo.kicker'),
          big: loads
            ? t('card.evo.big', { value: one(d.deltaKg) })
            : t('card.evo.bigPct', { value: d.deltaPct }),
          line: loads
            ? t('card.evo.line', { from: one(first), to: one(last) })
            : t('card.evo.lineNoLoads'),
          rows: [
            { key: 'workouts', label: t('card.evo.workouts'), value: String(d.workouts) },
            {
              key: 'streak',
              label: t('card.evo.streak'),
              value: t('card.days', { count: recap?.streakDays ?? 0 }),
            },
          ],
          bars: heights.map((height, i) => ({
            height,
            active: i === heights.length - 1,
            label: t(monthKeys[i] ?? 'card.months.m0'),
          })),
          dots: null,
        };
      }
      case 'pr': {
        const none = t('card.none');
        const r = recap?.records[0];
        const month = recap ? monthName(recap.month) : none;
        const since = r && r.kg !== null && r.firstKg !== null ? r.kg - r.firstKg : null;
        return {
          kicker: t('card.pr.kicker'),
          big: !r
            ? none
            : loads && r.kg !== null
              ? t('card.kg', { value: one(r.kg) })
              : t('card.pr.bigReps', { reps: r.reps }),
          line: !r
            ? t('card.pr.lineNone')
            : loads && r.kg !== null
              ? t('card.pr.line', {
                  name: r.name,
                  reps: r.reps,
                  delta: one(r.kg - (r.previousKg ?? 0)),
                })
              : t('card.pr.lineNoLoads', { name: r.name }),
          rows: [
            {
              key: 'month',
              label: t('card.pr.month', { month }),
              value: String(recap?.records.length ?? 0),
            },
            {
              key: 'since',
              label: t('card.pr.since'),
              value:
                since === null || !r?.firstKg
                  ? none
                  : loads
                    ? t('card.pr.sinceKg', { value: one(since) })
                    : t('card.pr.sincePct', { value: Math.round((since / r.firstKg) * 100) }),
            },
          ],
          bars: null,
          dots: null,
        };
      }
      case 'week': {
        const done = week?.workouts ?? 0;
        const goal = week?.goal ?? 0;
        const streak = week?.streakDays ?? 0;
        const base = done >= goal ? t('card.week.lineMet') : t('card.week.lineBelow');
        return {
          kicker: t('card.week.kicker', { range: weekRange }),
          big: t('card.week.big', { done, goal }),
          line: streak > 1 ? `${base} ${t('card.week.streak', { days: streak })}` : base,
          rows: [
            {
              key: 'strength',
              label: t('card.week.strength'),
              value: t('card.week.strengthValue', { count: week?.strengthSessions ?? 0 }),
            },
            {
              key: 'run',
              label: t('card.week.run'),
              value: t('card.km', { value: one((week?.runDistanceM ?? 0) / 1000) }),
            },
          ],
          bars: null,
          dots: weekdayKeys.map((key, i) => ({
            active: (week?.days[i]?.kind ?? 'rest') !== 'rest',
            label: t(key),
          })),
        };
      }
      case 'run': {
        const d = runMock;
        const heights = splitBarHeights(d.splits);
        return {
          kicker: t('card.run.kicker'),
          big: t('card.km', { value: one(d.km) }),
          line: times ? t('card.run.line', { pace: d.pace }) : t('card.run.lineNoTimes'),
          rows: times
            ? [
                { key: 'time', label: t('card.run.time'), value: d.time },
                {
                  key: 'pace',
                  label: t('card.run.pace'),
                  value: t('card.run.paceValue', { pace: d.pace }),
                },
              ]
            : [
                {
                  key: 'distance',
                  label: t('card.run.distance'),
                  value: t('card.km', { value: one(d.km) }),
                },
              ],
          bars: times
            ? heights.map((height, i) => ({
                height,
                active: i === heights.length - 1,
                label: t('card.run.split', { value: i * 2 + 2 }),
              }))
            : null,
          dots: null,
        };
      }
      case 'month': {
        const none = t('card.none');
        const diff = recap ? recap.workouts - recap.previousWorkouts : 0;
        const args = {
          count: Math.abs(diff),
          previous: recap ? monthName(previousMonthKey(recap.month)) : none,
        };
        return {
          kicker: t('card.month.kicker', {
            month: recap ? monthName(recap.month, true) : none,
          }),
          big: recap ? String(recap.workouts) : none,
          line:
            diff > 0
              ? t('card.month.lineMore', args)
              : diff < 0
                ? t('card.month.lineFewer', args)
                : t('card.month.lineSame', args),
          rows: [
            {
              key: 'run',
              label: t('card.month.run'),
              value: t('card.km', { value: one((recap?.runDistanceM ?? 0) / 1000) }),
            },
            ...(loads
              ? [
                  {
                    key: 'volume',
                    label: t('card.month.volume'),
                    value: t('card.tons', { value: one((recap?.volumeKg ?? 0) / 1000) }),
                  },
                ]
              : []),
            {
              key: 'records',
              label: t('card.month.records'),
              value: String(recap?.records.length ?? 0),
            },
          ],
          bars: null,
          dots: null,
        };
      }
    }
  }, [template, loads, times, t, week, weekRange, recap]);
}

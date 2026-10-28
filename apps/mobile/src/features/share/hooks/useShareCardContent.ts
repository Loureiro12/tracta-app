import { useMemo } from 'react';

import { formatNumber, useTranslation } from '@/shared/i18n';

import {
  evoBarHeights,
  evoMock,
  monthMock,
  prMock,
  runMock,
  splitBarHeights,
  todayMock,
  weekMock,
} from '../model/share.mock';

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

/** Builds the card copy for a template honouring the "show loads / times" options (prototype `C`). */
export function useShareCardContent(
  template: ShareTemplate,
  options: Record<ShareOption, boolean>,
): CardContent {
  const { t } = useTranslation('share');
  const { loads, times } = options;

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
              value: t('card.days', { count: d.streakDays }),
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
        const d = prMock;
        return {
          kicker: t('card.pr.kicker'),
          big: loads ? t('card.kg', { value: one(d.kg) }) : t('card.pr.bigReps', { reps: d.reps }),
          line: loads
            ? t('card.pr.line', { reps: d.reps, delta: one(d.deltaKg) })
            : t('card.pr.lineNoLoads'),
          rows: [
            { key: 'month', label: t('card.pr.month'), value: String(d.recordsThisMonth) },
            {
              key: 'since',
              label: t('card.pr.since'),
              value: loads
                ? t('card.pr.sinceKg', { value: one(d.sinceStartKg) })
                : t('card.pr.sincePct', { value: d.sinceStartPct }),
            },
          ],
          bars: null,
          dots: null,
        };
      }
      case 'week': {
        const d = weekMock;
        return {
          kicker: t('card.week.kicker'),
          big: t('card.week.big', { done: d.done, goal: d.goal }),
          line: t('card.week.line', { days: d.streakDays }),
          rows: [
            {
              key: 'strength',
              label: t('card.week.strength'),
              value: t('card.week.strengthValue', { count: d.strengthWorkouts }),
            },
            { key: 'run', label: t('card.week.run'), value: t('card.km', { value: one(d.runKm) }) },
          ],
          bars: null,
          dots: weekdayKeys.map((key, i) => ({ active: d.activeDays.includes(i), label: t(key) })),
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
        const d = monthMock;
        return {
          kicker: t('card.month.kicker'),
          big: String(d.workouts),
          line: t('card.month.line', { more: d.moreThanPrevious }),
          rows: [
            {
              key: 'run',
              label: t('card.month.run'),
              value: t('card.km', { value: one(d.runKm) }),
            },
            ...(loads
              ? [
                  {
                    key: 'volume',
                    label: t('card.month.volume'),
                    value: t('card.tons', { value: one(d.volumeTons) }),
                  },
                ]
              : []),
            { key: 'records', label: t('card.month.records'), value: String(d.records) },
          ],
          bars: null,
          dots: null,
        };
      }
    }
  }, [template, loads, times, t]);
}

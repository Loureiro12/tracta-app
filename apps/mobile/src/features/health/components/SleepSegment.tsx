import { useMemo } from 'react';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  Divider,
  HStack,
  ProgressBar,
  Segmented,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { formatDate, useTranslation } from '@/shared/i18n';

import { BarChart } from './BarChart';
import { CardHeader } from './CardHeader';
import { CompareTable } from './CompareTable';
import { Hypnogram } from './Hypnogram';
import { StatCell, StatGrid } from './StatGrid';
import { healthIds as ids } from '../health.testids';
import { useHealthData } from '../hooks/useHealthData';
import {
  addDays,
  bedtimeSuggestion,
  dayKeys,
  formatClock,
  keyToDate,
  nightRange,
  sleepAxis,
  sleepMonth,
  sleepScore,
  sleepWeek,
  stageTotals,
  trainVsRest,
  weekdayOf,
} from '../lib/derive';
import { formatCompareValue, hm, minutesLabel } from '../lib/format';
import { SLEEP_STAGE_LEGEND } from '../model/health.constants';
import { stageColor } from '../model/health.palette';
import { useHealthStore } from '../model/health.store';

import type { ChartBar } from './BarChart';
import type { CompareValue, SleepCompareKey, TrainRestKey } from '../model/health.constants';
import type { SleepRange } from '../model/health.types';

const RANGES: readonly SleepRange[] = ['7', '30', 'cmp'];
const SCALE_MAX = 540;
const text = (v: string | null): CompareValue =>
  v == null ? { kind: 'none' } : { kind: 'text', text: v };

export function SleepSegment() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const theme = useTheme();
  const range = useHealthStore((s) => s.sleepRange);
  const setRange = useHealthStore((s) => s.setSleepRange);
  const { get, todayKey, goals, entries, sourceName } = useHealthData();
  const goal = goals.sleepMinutes;

  const night = get(todayKey);
  const slept = night?.sleepMinutes ?? null;
  const inBed = night?.inBedMinutes ?? slept ?? 0;
  const totals = stageTotals(night);
  const score = sleepScore(get, todayKey, goal);
  const week = sleepWeek(get, todayKey, goal);
  const prev = sleepWeek(get, addDays(todayKey, -7), goal);
  const month = sleepMonth(get, todayKey, goal);
  const tvr = trainVsRest(get, todayKey, entries);
  const suggestion = bedtimeSuggestion(get, todayKey);
  const stageTopStyle = useMemo(() => ({ borderTopWidth: 3, paddingTop: 7 }), []);

  const weekKeys = dayKeys(todayKey, 7);
  const weekBars: ChartBar[] = weekKeys.map((k, i) => ({
    value: get(k)?.sleepMinutes ?? null,
    color: i === 6 ? 'sleep' : 'sleepLight',
    label: t(`weekday.${weekdayOf(k)}`),
  }));
  const monthBars: ChartBar[] = dayKeys(todayKey, 30).map((k, i) => {
    const m = get(k)?.sleepMinutes ?? null;
    const onGoal = m != null && m >= goal;
    return {
      value: m,
      color: i === 29 || onGoal ? 'sleep' : 'sleepLight',
      ...(i !== 29 && onGoal ? { opacity: 0.55 } : {}),
    };
  });
  const monthKeys = dayKeys(todayKey, 30);
  const shortDate = (k: string) => formatDate(keyToDate(k), { day: 'numeric', month: 'short' });
  const monthAxis = [monthKeys[0]!, monthKeys[15]!, monthKeys[29]!].map(shortDate);
  const ofNights = (hit: number, total: number) => t('sleep.compare.ofNights', { hit, total });

  const heroSub =
    slept == null
      ? null
      : slept < goal
        ? t('sleep.heroSub', { diff: minutesLabel(goal - slept), goal: hm(goal), inBed: hm(inBed) })
        : slept > goal
          ? t('sleep.heroSubAbove', {
              diff: minutesLabel(slept - goal),
              goal: hm(goal),
              inBed: hm(inBed),
            })
          : t('sleep.heroSubOnGoal', { goal: hm(goal), inBed: hm(inBed) });

  const delta = (a: number | null, b: number | null, threshold: number) =>
    a == null || b == null || Math.abs(a - b) < threshold ? null : a - b;
  const dDur = delta(week.avg, prev.avg, 5);
  const dBed = delta(week.bedtime, prev.bedtime, 5);
  const dReg = delta(week.regularity, prev.regularity, 3);
  const dGoal = delta(week.onGoal, prev.onGoal, 1);
  const dWake = delta(week.wakeups, prev.wakeups, 0.5);
  const compareRows: {
    key: SleepCompareKey;
    current: CompareValue;
    previous: CompareValue;
    delta: string;
    better: boolean;
  }[] = [
    {
      key: 'duration',
      current: text(week.avg == null ? null : hm(week.avg)),
      previous: text(prev.avg == null ? null : hm(prev.avg)),
      delta:
        dDur == null
          ? t('sleep.compare.delta.similar')
          : t(dDur > 0 ? 'sleep.compare.delta.more' : 'sleep.compare.delta.less', {
              value: Math.abs(dDur),
            }),
      better: dDur != null && dDur > 0,
    },
    {
      key: 'bedtime',
      current: text(week.bedtime == null ? null : formatClock(week.bedtime)),
      previous: text(prev.bedtime == null ? null : formatClock(prev.bedtime)),
      delta:
        dBed == null
          ? t('sleep.compare.delta.similar')
          : t(dBed < 0 ? 'sleep.compare.delta.earlier' : 'sleep.compare.delta.later', {
              value: Math.abs(dBed),
            }),
      better: dBed != null && dBed < 0,
    },
    {
      key: 'regularity',
      current: text(week.regularity == null ? null : `±${week.regularity} min`),
      previous: text(prev.regularity == null ? null : `±${prev.regularity} min`),
      delta:
        dReg == null
          ? t('sleep.compare.delta.similar')
          : t(dReg < 0 ? 'sleep.compare.delta.moreRegular' : 'sleep.compare.delta.lessRegular'),
      better: dReg != null && dReg < 0,
    },
    {
      key: 'onGoal',
      current: { kind: 'ratio', hit: week.onGoal, total: week.nights },
      previous: { kind: 'ratio', hit: prev.onGoal, total: prev.nights },
      delta:
        dGoal == null
          ? t('sleep.compare.delta.similar')
          : t(dGoal > 0 ? 'sleep.compare.delta.moreNights' : 'sleep.compare.delta.fewerNights', {
              count: Math.abs(dGoal),
            }),
      better: dGoal != null && dGoal > 0,
    },
    {
      key: 'wakeups',
      current:
        week.wakeups == null
          ? { kind: 'none' }
          : { kind: 'number', value: week.wakeups, digits: 1 },
      previous:
        prev.wakeups == null
          ? { kind: 'none' }
          : { kind: 'number', value: prev.wakeups, digits: 1 },
      delta:
        dWake == null
          ? t('sleep.compare.delta.similar')
          : t(dWake > 0 ? 'sleep.compare.delta.moreWakeups' : 'sleep.compare.delta.fewerWakeups'),
      better: dWake != null && dWake < 0,
    },
  ];
  const compareNote = t('sleep.compare.note', {
    current: `${shortDate(weekKeys[0]!)}–${shortDate(todayKey)}`,
    previous: `${shortDate(addDays(todayKey, -13))}–${shortDate(addDays(todayKey, -7))}`,
  });

  const round = (v: number | null) => (v == null ? null : Math.round(v));
  const tvrDelta = (
    a: number | null,
    b: number | null,
    threshold: number,
    more: 'sleepMore' | 'hrMore',
    less: 'sleepLess' | 'hrLess',
  ) => {
    const d = delta(round(a), round(b), threshold);
    return d == null
      ? t('sleep.trainRest.delta.similar')
      : t(`sleep.trainRest.delta.${d > 0 ? more : less}`, { value: Math.abs(d) });
  };
  const stepsPct =
    tvr.train.steps != null && tvr.rest.steps
      ? Math.round(((tvr.train.steps - tvr.rest.steps) / tvr.rest.steps) * 100)
      : null;
  const trainRows: {
    key: TrainRestKey;
    train: CompareValue;
    rest: CompareValue;
    delta: string;
    better: boolean;
  }[] = [
    {
      key: 'sleepAfter',
      train: text(tvr.train.sleepAfter == null ? null : hm(tvr.train.sleepAfter)),
      rest: text(tvr.rest.sleepAfter == null ? null : hm(tvr.rest.sleepAfter)),
      delta: tvrDelta(tvr.train.sleepAfter, tvr.rest.sleepAfter, 5, 'sleepMore', 'sleepLess'),
      better: (tvr.train.sleepAfter ?? 0) > (tvr.rest.sleepAfter ?? 0) + 5,
    },
    {
      key: 'steps',
      train:
        tvr.train.steps == null ? { kind: 'none' } : { kind: 'number', value: tvr.train.steps },
      rest: tvr.rest.steps == null ? { kind: 'none' } : { kind: 'number', value: tvr.rest.steps },
      delta:
        stepsPct == null || Math.abs(stepsPct) < 5
          ? t('sleep.trainRest.delta.similar')
          : t(`sleep.trainRest.delta.${stepsPct > 0 ? 'stepsMore' : 'stepsLess'}`, {
              pct: Math.abs(stepsPct),
            }),
      better: (stepsPct ?? 0) >= 5,
    },
    {
      key: 'restingHr',
      train:
        tvr.train.restingHr == null
          ? { kind: 'none' }
          : { kind: 'number', value: tvr.train.restingHr, unit: 'bpm' },
      rest:
        tvr.rest.restingHr == null
          ? { kind: 'none' }
          : { kind: 'number', value: tvr.rest.restingHr, unit: 'bpm' },
      delta: tvrDelta(tvr.train.restingHr, tvr.rest.restingHr, 2, 'hrMore', 'hrLess'),
      better: false,
    },
  ];

  const weekInsight =
    dDur == null
      ? null
      : t(dDur > 0 ? 'sleep.week.insightBold' : 'sleep.week.insightBoldShorter', {
          minutes: Math.abs(dDur),
        });

  if (slept == null) {
    return (
      <VStack gap="md">
        <Box testID={ids.sleepHero} gap="xs" py="sm" px="xxs">
          <Text variant="heroLg">—</Text>
          <Text variant="small" color="text2">
            {t('sleep.empty', { source: sourceName })}
          </Text>
        </Box>
      </VStack>
    );
  }

  const detail = (key: string) => {
    switch (key) {
      case 'duration':
        return t('sleep.score.detail.duration', { slept: hm(slept), goal: hm(goal) });
      case 'regularity':
        return t('sleep.score.detail.regularity', { value: score?.regularityMin ?? 0 });
      case 'interruptions':
        return t('sleep.score.detail.interruptions', {
          count: score?.wakeups ?? 0,
          minutes: score?.awakeMinutes ?? 0,
        });
      default:
        return t('sleep.score.detail.consistency', { count: score?.nights ?? 0 });
    }
  };

  return (
    <VStack gap="md">
      <Box testID={ids.sleepHero} gap="xs" py="sm" px="xxs">
        <Text variant="secondary" color="text2">
          {t('sleep.heroSource', { night: nightRange(todayKey, formatDate), source: sourceName })}
        </Text>
        <Text variant="heroLg">
          {hm(slept)}
          <Text variant="nameTitle" color="text2">
            {t('sleep.heroSlept')}
          </Text>
        </Text>
        <Text variant="small" color="text2">
          {heroSub}
        </Text>
      </Box>

      <Card testID={ids.sleepStages} gap="ml">
        <CardHeader title={t('sleep.stages.title')} hint={t('sleep.stages.hint')} />
        <Hypnogram
          segments={night?.sleepStages ?? []}
          axis={sleepAxis(night)}
          stageLabel={(s) => t(`sleep.stages.${s}`)}
        />
        <StatGrid testID={ids.sleepStage} columns={4} gap="sm">
          {SLEEP_STAGE_LEGEND.map((stage) => (
            <Box
              key={stage}
              testID={`${ids.sleepStage}.${stage}`}
              gap="xxs"
              style={[stageTopStyle, { borderTopColor: theme.colors[stageColor(stage)] }]}
            >
              <Text variant="micro" color="text2">
                {t(`sleep.stages.${stage}`)}
              </Text>
              <Text variant="cardTitleSm" numberOfLines={1}>
                {totals[stage] >= 60 ? hm(totals[stage]) : `${totals[stage]} min`}
              </Text>
              <Text variant="micro" color="text2">
                {`${Math.round((totals[stage] / Math.max(1, inBed)) * 100)}%`}
              </Text>
            </Box>
          ))}
        </StatGrid>
        <Text variant="caption" color="text2">
          {t('sleep.stages.note')}
        </Text>
      </Card>

      <Card gap="ml">
        <HStack justify="space-between" align="flex-end">
          <Box gap="xxs">
            <Text variant="bodySemibold">{t('sleep.score.title')}</Text>
            <Text variant="caption" color="text2">
              {t('sleep.score.subtitle')}
            </Text>
          </Box>
          <Text testID={ids.sleepScore} variant="heroLg">
            {String(score?.total ?? '—')}
            <Text variant="cardTitleSm" color="text2">
              {t('sleep.score.outOf')}
            </Text>
          </Text>
        </HStack>
        <VStack testID={ids.sleepFactor} gap="ml">
          {(score?.factors ?? []).map((f) => (
            <Box key={f.key} testID={`${ids.sleepFactor}.${f.key}`} gap="xs">
              <HStack justify="space-between">
                <Text variant="secondary">
                  {t(`sleep.score.factor.${f.key}`)}
                  <Text variant="secondary" color="text2">
                    {` · ${detail(f.key)}`}
                  </Text>
                </Text>
                <Text variant="secondarySemibold" tabular>
                  {t('sleep.score.points', { pts: f.pts, max: f.max })}
                </Text>
              </HStack>
              <ProgressBar value={f.pct / 100} color="sleep" height={5} />
            </Box>
          ))}
        </VStack>
        <Divider />
        <Text variant="caption" color="text2">
          {t('sleep.score.note')}
        </Text>
        <Button
          testID={ids.sleepScoreHow}
          label={t('sleep.score.how')}
          variant="ghost"
          size="sm"
          onPress={() => router.push('/health/score')}
        />
      </Card>

      <Card gap="ml">
        <Segmented
          testID={ids.sleepRange}
          options={RANGES.map((value) => ({ value, label: t(`sleep.range.${value}`) }))}
          value={range}
          onChange={setRange}
        />
        {range === '7' ? (
          <VStack testID={ids.sleepWeek} gap="md">
            <CardHeader
              title={t('sleep.week.title')}
              hint={t('sleep.week.avg', { value: week.avg == null ? '—' : hm(week.avg) })}
            />
            <BarChart
              bars={weekBars}
              height={120}
              max={SCALE_MAX}
              gap={10}
              goal={goal}
              goalLabel={t('sleep.week.goal')}
            />
            <Divider />
            {weekInsight ? (
              <Text variant="small">
                {t('sleep.week.insightBefore')}
                <Text variant="smallBold">{weekInsight}</Text>
                {t('sleep.week.insightAfter', {
                  avg: hm(week.avg ?? 0),
                  previous: hm(prev.avg ?? 0),
                })}
              </Text>
            ) : (
              <Text variant="small">{t('sleep.week.insightSame', { avg: hm(week.avg ?? 0) })}</Text>
            )}
          </VStack>
        ) : null}
        {range === '30' ? (
          <VStack testID={ids.sleepMonth} gap="md">
            <CardHeader
              title={t('sleep.month.title')}
              hint={t('sleep.month.avg', { value: month.avg == null ? '—' : hm(month.avg) })}
            />
            <BarChart
              bars={monthBars}
              height={120}
              max={SCALE_MAX}
              gap={3}
              radius={3}
              goal={goal}
              axis={monthAxis}
            />
            <Divider />
            <StatGrid columns={3} gap="sm">
              <StatCell
                label={t('sleep.month.onGoal')}
                value={t('sleep.month.onGoalValue', { hit: month.hit, total: month.total })}
                valueVariant="cardTitle"
              />
              <StatCell
                label={t('sleep.month.longest')}
                value={month.longest == null ? '—' : hm(month.longest)}
                valueVariant="cardTitle"
              />
              <StatCell
                label={t('sleep.month.shortest')}
                value={month.shortest == null ? '—' : hm(month.shortest)}
                valueVariant="cardTitle"
              />
            </StatGrid>
            <Text variant="small">{t('sleep.month.insight', { avg: hm(month.avg ?? 0) })}</Text>
          </VStack>
        ) : null}
        {range === 'cmp' ? (
          <CompareTable
            testID={ids.sleepCompare}
            columnA={t('sleep.compare.thisWeek')}
            columnB={t('sleep.compare.previous')}
            rows={compareRows.map((row) => ({
              key: row.key,
              label: t(`sleep.compare.row.${row.key}`),
              delta: row.delta,
              deltaColor: row.better ? 'brandText' : 'text2',
              a: formatCompareValue(row.current, ofNights),
              b: formatCompareValue(row.previous, ofNights),
            }))}
            note={compareNote}
          />
        ) : null}
      </Card>

      <Card testID={ids.sleepBedtime}>
        <StatGrid columns={2}>
          <StatCell
            label={t('sleep.bedtime.avg')}
            value={
              week.bedtime == null
                ? '—'
                : t('sleep.bedtime.avgValue', { time: formatClock(week.bedtime) })
            }
            valueVariant="nameTitle"
          />
          <StatCell
            label={t('sleep.bedtime.variation')}
            value={
              week.regularity == null
                ? '—'
                : t('sleep.bedtime.variationValue', { value: week.regularity })
            }
            valueVariant="nameTitle"
          />
        </StatGrid>
      </Card>

      <Card gap="xs">
        <Box pb="sm">
          <CardHeader title={t('sleep.trainRest.title')} hint={t('sleep.trainRest.month')} />
        </Box>
        <CompareTable
          testID={ids.sleepTrainRest}
          columnA={t('sleep.trainRest.train')}
          columnB={t('sleep.trainRest.rest')}
          labelFlex={1.3}
          rowPy="sm"
          rows={trainRows.map((row) => ({
            key: row.key,
            label: t(`sleep.trainRest.row.${row.key}`),
            delta: row.delta,
            deltaColor: row.better ? 'brandText' : 'text2',
            a: formatCompareValue(row.train, ofNights),
            b: formatCompareValue(row.rest, ofNights),
          }))}
          note={t('sleep.trainRest.note', { train: tvr.train.days, rest: tvr.rest.days })}
        />
      </Card>

      <Box testID={ids.sleepSuggestion} bg="fill1" radius="card" p="xl" gap="sm">
        <Text variant="microBold" color="sleep" uppercase>
          {t('sleep.suggestion.label')}
        </Text>
        <Text variant="body">
          {suggestion && suggestion.diff > 0
            ? t('sleep.suggestion.text', {
                count: suggestion.count,
                time: formatClock(suggestion.cut),
                minutes: suggestion.diff,
              })
            : t('sleep.suggestion.textNeutral')}
        </Text>
      </Box>
    </VStack>
  );
}

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

import { useTranslation } from '@/shared/i18n';

import { BarChart } from './BarChart';
import { CardHeader } from './CardHeader';
import { CompareTable } from './CompareTable';
import { Hypnogram } from './Hypnogram';
import { StatCell, StatGrid } from './StatGrid';
import { healthIds as ids } from '../health.testids';
import { sleep30, stageTotals } from '../lib/derive';
import { formatCompareValue, hm } from '../lib/format';
import {
  MONTH_AXIS,
  NIGHTS,
  NIGHTS_30,
  SLEEP_COMPARE,
  SLEEP_FACTORS,
  SLEEP_GOAL_MIN,
  SLEEP_IN_BED_MIN,
  SLEEP_LAST_NIGHT_MIN,
  SLEEP_SCORE,
  SLEEP_STAGE_LEGEND,
  TRAIN_VS_REST,
} from '../model/health.mock';
import { stageColor } from '../model/health.palette';
import { useHealthStore } from '../model/health.store';

import type { ChartBar } from './BarChart';
import type { SleepRange } from '../model/health.types';

const RANGES: readonly SleepRange[] = ['7', '30', 'cmp'];
const SCALE_MAX = 540;

export function SleepSegment() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const theme = useTheme();
  const range = useHealthStore((s) => s.sleepRange);
  const setRange = useHealthStore((s) => s.setSleepRange);

  const totals = useMemo(() => stageTotals(), []);
  const month = useMemo(() => sleep30(), []);
  const stageTopStyle = useMemo(() => ({ borderTopWidth: 3, paddingTop: 7 }), []);

  const weekBars: ChartBar[] = NIGHTS.map(([m, d], i) => ({
    value: m,
    color: i === 6 ? 'sleep' : 'sleepLight',
    label: t(`weekday.${d}`),
  }));
  const monthBars: ChartBar[] = NIGHTS_30.map((m, i) => ({
    value: m,
    color: i === 29 ? 'sleep' : m >= SLEEP_GOAL_MIN ? 'sleep' : 'sleepLight',
    ...(i !== 29 && m >= SLEEP_GOAL_MIN ? { opacity: 0.55 } : {}),
  }));
  const ofNights = (hit: number, total: number) => t('sleep.compare.ofNights', { hit, total });

  return (
    <VStack gap="md">
      <Box testID={ids.sleepHero} gap="xs" py="sm" px="xxs">
        <Text variant="secondary" color="text2">
          {t('sleep.heroSource')}
        </Text>
        <Text variant="heroLg">
          {hm(SLEEP_LAST_NIGHT_MIN)}
          <Text variant="nameTitle" color="text2">
            {t('sleep.heroSlept')}
          </Text>
        </Text>
        <Text variant="small" color="text2">
          {t('sleep.heroSub', { goal: hm(SLEEP_GOAL_MIN), inBed: hm(SLEEP_IN_BED_MIN) })}
        </Text>
      </Box>

      <Card testID={ids.sleepStages} gap="ml">
        <CardHeader title={t('sleep.stages.title')} hint={t('sleep.stages.hint')} />
        <Hypnogram stageLabel={(s) => t(`sleep.stages.${s}`)} />
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
                {`${Math.round((totals[stage] / SLEEP_IN_BED_MIN) * 100)}%`}
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
            {String(SLEEP_SCORE)}
            <Text variant="cardTitleSm" color="text2">
              {t('sleep.score.outOf')}
            </Text>
          </Text>
        </HStack>
        <VStack testID={ids.sleepFactor} gap="ml">
          {SLEEP_FACTORS.map((f) => (
            <Box key={f.key} testID={`${ids.sleepFactor}.${f.key}`} gap="xs">
              <HStack justify="space-between">
                <Text variant="secondary">
                  {t(`sleep.score.factor.${f.key}`)}
                  <Text variant="secondary" color="text2">
                    {` · ${t(`sleep.score.detail.${f.key}`, { slept: hm(SLEEP_LAST_NIGHT_MIN), goal: hm(SLEEP_GOAL_MIN) })}`}
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
              hint={t('sleep.week.avg', { value: '7h 20' })}
            />
            <BarChart
              bars={weekBars}
              height={120}
              max={SCALE_MAX}
              gap={10}
              goal={SLEEP_GOAL_MIN}
              goalLabel={t('sleep.week.goal')}
            />
            <Divider />
            <Text variant="small">
              {t('sleep.week.insightBefore')}
              <Text variant="smallBold">{t('sleep.week.insightBold')}</Text>
              {t('sleep.week.insightAfter')}
            </Text>
          </VStack>
        ) : null}
        {range === '30' ? (
          <VStack testID={ids.sleepMonth} gap="md">
            <CardHeader
              title={t('sleep.month.title')}
              hint={t('sleep.month.avg', { value: hm(month.avg) })}
            />
            <BarChart
              bars={monthBars}
              height={120}
              max={SCALE_MAX}
              gap={3}
              radius={3}
              goal={SLEEP_GOAL_MIN}
              axis={MONTH_AXIS}
            />
            <Divider />
            <StatGrid columns={3} gap="sm">
              <StatCell
                label={t('sleep.month.onGoal')}
                value={t('sleep.month.onGoalValue', { hit: month.hit })}
                valueVariant="cardTitle"
              />
              <StatCell
                label={t('sleep.month.longest')}
                value={hm(month.longest)}
                valueVariant="cardTitle"
              />
              <StatCell
                label={t('sleep.month.shortest')}
                value={hm(month.shortest)}
                valueVariant="cardTitle"
              />
            </StatGrid>
            <Text variant="small">{t('sleep.month.insight', { avg: hm(month.avg) })}</Text>
          </VStack>
        ) : null}
        {range === 'cmp' ? (
          <CompareTable
            testID={ids.sleepCompare}
            columnA={t('sleep.compare.thisWeek')}
            columnB={t('sleep.compare.previous')}
            rows={SLEEP_COMPARE.map((row) => ({
              key: row.key,
              label: t(`sleep.compare.row.${row.key}`),
              delta: t(`sleep.compare.delta.${row.key}`),
              deltaColor: row.better ? 'brandText' : 'text2',
              a: formatCompareValue(row.current, ofNights),
              b: formatCompareValue(row.previous, ofNights),
            }))}
            note={t('sleep.compare.note')}
          />
        ) : null}
      </Card>

      <Card testID={ids.sleepBedtime}>
        <StatGrid columns={2}>
          <StatCell
            label={t('sleep.bedtime.avg')}
            value={t('sleep.bedtime.avgValue')}
            valueVariant="nameTitle"
          />
          <StatCell
            label={t('sleep.bedtime.variation')}
            value={t('sleep.bedtime.variationValue')}
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
          rows={TRAIN_VS_REST.map((row) => ({
            key: row.key,
            label: t(`sleep.trainRest.row.${row.key}`),
            delta: t(`sleep.trainRest.delta.${row.key}`),
            deltaColor: row.better ? 'brandText' : 'text2',
            a: formatCompareValue(row.train, ofNights),
            b: formatCompareValue(row.rest, ofNights),
          }))}
          note={t('sleep.trainRest.note')}
        />
      </Card>

      <Box testID={ids.sleepSuggestion} bg="fill1" radius="card" p="xl" gap="sm">
        <Text variant="microBold" color="sleep" uppercase>
          {t('sleep.suggestion.label')}
        </Text>
        <Text variant="body">{t('sleep.suggestion.text')}</Text>
      </Box>
    </VStack>
  );
}

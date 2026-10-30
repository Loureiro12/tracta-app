import { useMemo } from 'react';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  HStack,
  ProgressBar,
  Screen,
  Segmented,
  Stepper,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatDate, useTranslation } from '@/shared/i18n';

import { useRecordDates } from '../api/useHealth';
import { StatCell, StatGrid } from '../components/StatGrid';
import { healthIds as ids } from '../health.testids';
import { useHealthData } from '../hooks/useHealthData';
import { addDays, keyToDate, reportTotals } from '../lib/derive';
import { dayLabel, dec1, hm, num } from '../lib/format';
import { useHealthStore } from '../model/health.store';

import type { ReportPeriod } from '../model/health.types';
import type { SemanticColors } from '@tracta/design-system';

const PERIODS: readonly ReportPeriod[] = ['7', '30', 'custom'];
type ModalityKey = 'strength' | 'run' | 'walk' | 'other';
const MOD_COLORS: Record<ModalityKey, keyof SemanticColors> = {
  strength: 'brand',
  run: 'run',
  walk: 'brandOnDark',
  other: 'challenge',
};

/** Period report overlay (7 dias / 30 dias / Período custom) — opened from Histórico. */
export function ReportScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const theme = useTheme();
  const showToast = useFeedbackStore((s) => s.showToast);
  const period = useHealthStore((s) => s.reportPeriod);
  const setPeriod = useHealthStore((s) => s.setReportPeriod);
  const from = useHealthStore((s) => s.reportFrom);
  const to = useHealthStore((s) => s.reportTo);
  const adjustFrom = useHealthStore((s) => s.adjustReportFrom);
  const adjustTo = useHealthStore((s) => s.adjustReportTo);

  const { get, todayKey, goals: targets, entries } = useHealthData();
  const prDates = useRecordDates().data;
  const todayDate = keyToDate(todayKey);
  const monthKey = todayKey.slice(0, 8);
  const pad = (d: number) => String(d).padStart(2, '0');
  const [a, b] =
    period === '7'
      ? [addDays(todayKey, -6), todayKey]
      : period === '30'
        ? [addDays(todayKey, -29), todayKey]
        : [`${monthKey}${pad(from)}`, `${monthKey}${pad(Math.min(to, todayDate.getDate()))}`];
  const len = Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / 86_400_000) + 1;
  const c = reportTotals(a, b, get, entries, prDates ?? [], targets);
  const prev = reportTotals(addDays(a, -len), addDays(a, -1), get, entries, prDates ?? [], targets);
  const total = c.total;
  const prevHasData = prev.total > 0 || prev.steps != null;
  const prevTotal = prevHasData ? prev.total : null;
  const perWeek = total / Math.max(1, len / 7);
  const monthShort = formatDate(todayDate, { month: 'short' }).replace('.', '');
  const shortDate = (k: string) => formatDate(keyToDate(k), { day: 'numeric', month: 'short' });

  const mods = (
    [
      ['strength', c.strength],
      ['run', c.runs],
      ['walk', c.walks],
      ['other', c.others],
    ] as const
  ).filter((x) => x[1] > 0);
  const barStyle = useMemo(
    () => ({
      height: 14,
      borderRadius: 7,
      overflow: 'hidden' as const,
      gap: 2,
      flexDirection: 'row' as const,
      backgroundColor: theme.colors.fill2,
    }),
    [theme],
  );
  const dotStyle = useMemo(() => ({ width: 10, height: 10, borderRadius: 3 }), []);

  const compare =
    prevTotal == null
      ? t('report.compare.none')
      : total > prevTotal
        ? t('report.compare.more', { count: total - prevTotal })
        : total < prevTotal
          ? t('report.compare.less', { count: prevTotal - total })
          : t('report.compare.same');

  const stats = [
    { key: 'volume', value: t('report.stat.volumeValue', { value: dec1(c.vol / 1000) }) },
    { key: 'distance', value: t('report.stat.distanceValue', { value: dec1(c.km) }) },
    { key: 'steps', value: c.steps == null ? t('report.stat.none') : num(c.steps) },
    { key: 'sleep', value: c.sleep == null ? t('report.stat.none') : hm(c.sleep) },
    { key: 'frequency', value: t('report.stat.frequencyValue', { value: dec1(perWeek) }) },
    { key: 'records', value: String(c.prs) },
  ] as const;

  const goals = [
    {
      key: 'steps',
      label: t('report.goals.steps', { goal: num(targets.steps) }),
      value: t('report.goals.stepsValue', { hit: c.stepHit, total: c.n }),
      p: c.stepHit / Math.max(1, c.n),
    },
    {
      key: 'sleep',
      label: t('report.goals.sleep', { goal: hm(targets.sleepMinutes) }),
      value: t('report.goals.sleepValue', { hit: c.sleepHit, total: c.n }),
      p: c.sleepHit / Math.max(1, c.n),
    },
    {
      key: 'workouts',
      label: t('report.goals.workouts', { goal: targets.workouts }),
      value: t('report.goals.workoutsValue', { value: dec1(perWeek), goal: targets.workouts }),
      p: Math.min(1, perWeek / targets.workouts),
    },
  ] as const;

  return (
    <Screen
      testID={ids.reportScreen}
      header={
        <BackHeader
          testID={ids.reportBack}
          label={t('report.back')}
          onPress={() => router.back()}
        />
      }
    >
      <Box gap="xs">
        <Text variant="secondary" color="text2">
          {t('report.range', { from: shortDate(a), to: shortDate(b) })}
        </Text>
        <Text testID={ids.reportTitle} variant="overlayTitle">
          {t('report.title')}
        </Text>
      </Box>
      <Segmented
        testID={ids.reportPeriod}
        options={PERIODS.map((value) => ({ value, label: t(`report.period.${value}`) }))}
        value={period}
        onChange={setPeriod}
      />
      {period === 'custom' ? (
        <HStack gap="sm" align="stretch">
          <Box flex={1} bg="surface" radius="md" align="center" gap="xxs" py="sm" px="xs">
            <Text variant="micro" color="text2">
              {t('report.from')}
            </Text>
            <Stepper
              testID={ids.reportFrom}
              valueLabel={dayLabel(from, monthShort)}
              onDecrement={() => adjustFrom(-1)}
              onIncrement={() => adjustFrom(1)}
              decrementLabel={t('report.decrement')}
              incrementLabel={t('report.increment')}
            />
          </Box>
          <Box flex={1} bg="surface" radius="md" align="center" gap="xxs" py="sm" px="xs">
            <Text variant="micro" color="text2">
              {t('report.to')}
            </Text>
            <Stepper
              testID={ids.reportTo}
              valueLabel={dayLabel(Math.min(to, todayDate.getDate()), monthShort)}
              onDecrement={() => adjustTo(-1, todayDate.getDate())}
              onIncrement={() => adjustTo(1, todayDate.getDate())}
              decrementLabel={t('report.decrement')}
              incrementLabel={t('report.increment')}
            />
          </Box>
        </HStack>
      ) : null}
      <Box gap="xxs" pt="xs">
        <Text testID={ids.reportSessions} variant="heroLg">
          {String(total)}
          <Text variant="stat" color="text2">
            {t('report.sessions')}
          </Text>
        </Text>
        <Text variant="secondary" color="text2">
          {compare}
        </Text>
      </Box>
      <Card>
        <Text variant="bodySemibold">{t('report.byModality')}</Text>
        <Box style={barStyle}>
          {mods.map(([key, v]) => (
            <Box
              key={key}
              bg={MOD_COLORS[key]}
              style={{ width: `${Math.max(4, Math.round((v / Math.max(1, total)) * 100))}%` }}
            />
          ))}
        </Box>
        <VStack testID={ids.reportModality} gap="sm">
          {mods.map(([key, v]) => (
            <HStack key={key} testID={`${ids.reportModality}.${key}`} justify="space-between">
              <HStack gap="sm">
                <Box bg={MOD_COLORS[key]} style={dotStyle} />
                <Text variant="small">{t(`report.modality.${key}`)}</Text>
              </HStack>
              <Text variant="smallSemibold">{t('report.sessionCount', { count: v })}</Text>
            </HStack>
          ))}
        </VStack>
      </Card>
      <StatGrid testID={ids.reportStat} columns={2} gap="sm">
        {stats.map((s) => (
          <Card
            key={s.key}
            testID={`${ids.reportStat}.${s.key}`}
            padding="ml"
            radius="xl"
            gap="xxs"
          >
            <StatCell
              label={t(`report.stat.${s.key}`)}
              value={s.value}
              sub={t(`report.stat.${s.key}Sub`)}
              valueVariant="nameTitle"
            />
          </Card>
        ))}
      </StatGrid>
      <Card gap="ml">
        <Text variant="bodySemibold">{t('report.goals.title')}</Text>
        <VStack testID={ids.reportGoal} gap="ml">
          {goals.map((g) => (
            <VStack key={g.key} testID={`${ids.reportGoal}.${g.key}`} gap="xs">
              <HStack justify="space-between" gap="sm">
                <Text variant="small">{g.label}</Text>
                <Text variant="smallSemibold">{g.value}</Text>
              </HStack>
              <ProgressBar value={g.p} />
            </VStack>
          ))}
        </VStack>
      </Card>
      <Text variant="caption" color="text2">
        {t('report.note')}
      </Text>
      <Button
        testID={ids.reportExport}
        label={t('report.export')}
        variant="surface"
        size="lg"
        fullWidth
        onPress={() => showToast(t('report.exported'))}
      />
    </Screen>
  );
}

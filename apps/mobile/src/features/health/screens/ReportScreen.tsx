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
import { useTranslation } from '@/shared/i18n';

import { StatCell, StatGrid } from '../components/StatGrid';
import { healthIds as ids } from '../health.testids';
import { reportTotals } from '../lib/derive';
import { dayLabel, dec1, hm, num } from '../lib/format';
import { GOALS } from '../model/health.mock';
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

  const [a, b] = period === '7' ? [20, 26] : period === '30' ? [1, 26] : [from, to];
  const c = useMemo(() => reportTotals(a, b), [a, b]);
  const len = b - a + 1;
  const prev = useMemo(() => reportTotals(a - len, a - 1), [a, len]);
  const extra = period === '30' ? 2 : 0;
  const total = c.total + extra;
  const prevTotal = prev.n ? prev.total : null;
  const perWeek = total / Math.max(1, len / 7);
  const oct = t('month.oct');

  const mods = (
    [
      ['strength', c.strength + extra],
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
    {
      key: 'volume',
      value: t('report.stat.volumeValue', { value: dec1((c.vol + extra * 9000) / 1000) }),
    },
    {
      key: 'distance',
      value: t('report.stat.distanceValue', { value: dec1(c.km + (period === '30' ? 5 : 0)) }),
    },
    { key: 'steps', value: num(c.steps / Math.max(1, c.n)) },
    { key: 'sleep', value: hm(c.sleep / Math.max(1, c.n)) },
    { key: 'frequency', value: t('report.stat.frequencyValue', { value: dec1(perWeek) }) },
    { key: 'records', value: String(c.prs) },
  ] as const;

  const goals = [
    {
      key: 'steps',
      label: t('report.goals.steps', { goal: num(GOALS.steps) }),
      value: t('report.goals.stepsValue', { hit: c.stepHit, total: c.n }),
      p: c.stepHit / Math.max(1, c.n),
    },
    {
      key: 'sleep',
      label: t('report.goals.sleep', { goal: hm(GOALS.sleep) }),
      value: t('report.goals.sleepValue', { hit: c.sleepHit, total: c.n }),
      p: c.sleepHit / Math.max(1, c.n),
    },
    {
      key: 'workouts',
      label: t('report.goals.workouts', { goal: GOALS.workouts }),
      value: t('report.goals.workoutsValue', { value: dec1(perWeek), goal: GOALS.workouts }),
      p: Math.min(1, perWeek / GOALS.workouts),
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
          {period === '30'
            ? t('report.range30')
            : t('report.range', { from: dayLabel(a, oct), to: dayLabel(b, oct) })}
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
              valueLabel={dayLabel(from, oct)}
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
              valueLabel={dayLabel(to, oct)}
              onDecrement={() => adjustTo(-1)}
              onIncrement={() => adjustTo(1)}
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

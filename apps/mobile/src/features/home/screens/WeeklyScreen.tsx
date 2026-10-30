import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  Chip,
  HStack,
  Logo,
  ProgressBar,
  Screen,
  Text,
  VStack,
} from '@tracta/design-system';

import { useHealthRange } from '@/features/health';
import { now } from '@/shared/clock';
import { formatNumber, useTranslation } from '@/shared/i18n';

import { useHomeGoals } from '../api/useHomeAccount';
import { useWeeklySummary } from '../api/useWeeklySummary';
import { homeIds } from '../home.testids';
import { useWeekRange } from '../hooks/useWeekRange';
import { addDays, previousWeekStart } from '../lib/week';
import { weeklyHealth } from '../lib/weeklyHealth';
import { useHomeStore } from '../model/home.store';

import type { achievements } from '@tracta/api';
import type { SemanticColors } from '@tracta/design-system';

type DayKind = achievements.WeekDay['kind'];

const DAY_COLORS: Record<DayKind, { bg: keyof SemanticColors; fg: keyof SemanticColors }> = {
  strength: { bg: 'brand', fg: 'textOnBrand' },
  run: { bg: 'run', fg: 'textOnBrand' },
  other: { bg: 'ink', fg: 'textOnInk' },
  rest: { bg: 'fill2', fg: 'text3' },
};
/** Glyph of a day without a routine label (data, not copy). */
const DAY_GLYPHS: Record<DayKind, string> = { strength: '•', run: '⟶', other: '•', rest: '—' };
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const one = (value: number) => formatNumber(value, { maximumFractionDigits: 1 });
/** Seconds → "4h 07" (data, not copy). */
const activeTime = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}`;
};
/** Seconds per km → "5:34". */
const pace = (seconds: number) => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** "Resumo semanal" full-screen overlay: the last full week, from the backend. */
export function WeeklyScreen() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const goals = useHomeGoals();
  const markWeeklySeen = useHomeStore((s) => s.markWeeklySeen);
  const weekStart = previousWeekStart(now());
  const summary = useWeeklySummary(weekStart);
  const w = summary.data;
  const range = useWeekRange(weekStart);
  const duration = (total: number) =>
    t('sleep.duration', {
      hours: Math.floor(total / 60),
      minutes: String(total % 60).padStart(2, '0'),
    });
  const sleepGoal = duration(goals.sleepMinutes);
  const previousStart = addDays(weekStart, -7);
  const previousRange = useWeekRange(previousStart);
  const healthDays = useHealthRange(previousStart, addDays(weekStart, 6)).data ?? [];
  const h = weeklyHealth(
    healthDays.filter((d) => d.day >= weekStart),
    healthDays.filter((d) => d.day < weekStart),
    goals,
  );

  const close = () => {
    markWeeklySeen();
    router.back();
  };

  const goal = w?.goal ?? goals.workouts;
  const workouts = w?.workouts ?? 0;
  const km = (w?.runDistanceM ?? 0) / 1000;
  const records = w?.records.length ?? 0;
  const met = !w || w.workouts >= w.goal;
  const restDays = w ? w.days.filter((d) => d.kind === 'rest').length : 0;

  const stats = [
    {
      key: 'workouts',
      label: t('weekly.stats.workouts'),
      value: String(workouts),
      sub: t('weekly.stats.workoutsSub', { goal }),
    },
    {
      key: 'active',
      label: t('weekly.stats.active'),
      value: activeTime(w?.activeSeconds ?? 0),
      sub: t('weekly.stats.activeSub'),
    },
    {
      key: 'distance',
      label: t('weekly.stats.distance'),
      value: t('move.km', { value: one(km) }),
      sub: t('weekly.stats.distanceSub', { count: w?.runs ?? 0 }),
    },
    {
      key: 'volume',
      label: t('weekly.stats.volume'),
      value: t('weekly.stats.volumeValue', { value: one((w?.volumeKg ?? 0) / 1000) }),
      sub: t('weekly.stats.volumeSub', { count: w?.strengthSessions ?? 0 }),
    },
  ];

  // Running pace vs the previous week (seconds per km).
  const paceNow = w && w.runDistanceM > 0 ? w.runSeconds / (w.runDistanceM / 1000) : null;
  const pacePrev =
    w && w.previous.runDistanceM > 0
      ? w.previous.runSeconds / (w.previous.runDistanceM / 1000)
      : null;
  const paceDelta = paceNow !== null && pacePrev !== null ? Math.round(pacePrev - paceNow) : null;
  const changes = [
    {
      id: 'sleep',
      up: (h.sleep.deltaMinutes ?? 0) > 0,
      title:
        h.sleep.averageMinutes === null
          ? t('weekly.change.sleep.titleNone')
          : t('weekly.change.sleep.title', { duration: duration(h.sleep.averageMinutes) }),
      description:
        h.sleep.deltaMinutes === null
          ? t('weekly.change.sleep.none')
          : h.sleep.deltaMinutes > 0
            ? t('weekly.change.sleep.more', { minutes: h.sleep.deltaMinutes })
            : h.sleep.deltaMinutes < 0
              ? t('weekly.change.sleep.less', { minutes: -h.sleep.deltaMinutes })
              : t('weekly.change.sleep.same'),
    },
    {
      id: 'steps',
      up: (h.steps.changePercent ?? 0) > 0,
      title:
        h.steps.average === null
          ? t('weekly.change.steps.titleNone')
          : t('weekly.change.steps.title', { value: formatNumber(h.steps.average) }),
      description: [
        h.steps.changePercent === null
          ? null
          : h.steps.changePercent > 0
            ? t('weekly.change.steps.more', { percent: h.steps.changePercent })
            : h.steps.changePercent < 0
              ? t('weekly.change.steps.less', { percent: -h.steps.changePercent })
              : t('weekly.change.steps.same'),
        t('weekly.change.steps.goal', { count: h.steps.goalDays }),
      ]
        .filter(Boolean)
        .join(' · '),
    },
    {
      id: 'hr',
      // A lower resting heart rate is the good direction.
      up: (h.restingHr.delta ?? 0) < 0,
      title:
        h.restingHr.average === null
          ? t('weekly.change.hr.titleNone')
          : t('weekly.change.hr.title', { bpm: h.restingHr.average }),
      description:
        h.restingHr.delta === null || Math.abs(h.restingHr.delta) < 2
          ? t('weekly.change.hr.stable', { range: h.restingHr.range ?? 0 })
          : h.restingHr.delta > 0
            ? t('weekly.change.hr.higher', { bpm: h.restingHr.delta })
            : t('weekly.change.hr.lower', { bpm: -h.restingHr.delta }),
    },
    {
      id: 'pace',
      up: paceDelta !== null && paceDelta > 0,
      title:
        paceNow === null
          ? t('weekly.change.pace.titleNone')
          : t('weekly.change.pace.title', { pace: pace(paceNow) }),
      description:
        paceNow === null || paceDelta === null
          ? t('weekly.change.pace.none')
          : paceDelta > 0
            ? t('weekly.change.pace.faster', { seconds: paceDelta })
            : paceDelta < 0
              ? t('weekly.change.pace.slower', { seconds: -paceDelta })
              : t('weekly.change.pace.same'),
    },
  ];

  const highlights = [
    ...(w?.records ?? []).map((r) => ({
      id: r.exerciseId,
      tag: t('weekly.highlightTag.pr'),
      text:
        r.kg === null
          ? t('weekly.highlight.recordBodyweight', { name: r.name, reps: r.reps })
          : t('weekly.highlight.record', { name: r.name, kg: one(r.kg), reps: r.reps }),
    })),
    ...(w?.longestRun
      ? [
          {
            id: w.longestRun.activityId,
            tag: t('weekly.highlightTag.km'),
            text: t(
              w.longestRun.longestOfMonth
                ? 'weekly.highlight.runMonth'
                : 'weekly.highlight.runWeek',
              {
                km: one(w.longestRun.distanceM / 1000),
              },
            ),
          },
        ]
      : []),
  ];

  const goalRows = [
    {
      id: 'workouts',
      label: t('weekly.goal.workouts'),
      value: t('weekly.goal.workoutsValue', { done: workouts, goal }),
      progress: goal > 0 ? Math.min(1, workouts / goal) : 0,
    },
    {
      id: 'steps',
      label: t('weekly.goal.steps', { goal: formatNumber(goals.steps) }),
      value: t('weekly.goal.stepsValue', { done: h.steps.goalDays, total: 7 }),
      progress: h.steps.goalDays / 7,
    },
    {
      id: 'sleep',
      label: t('weekly.goal.sleep', { goal: sleepGoal }),
      value: t('weekly.goal.sleepValue', { done: h.sleep.goalNights, total: 7 }),
      progress: h.sleep.goalNights / 7,
    },
  ];

  return (
    <Screen
      testID={homeIds.weeklyScreen}
      header={<BackHeader testID={homeIds.weeklyBack} label={t('weekly.back')} onPress={close} />}
    >
      <VStack gap="sm">
        <Text variant="captionBold" color="brandText" uppercase>
          {t('weekly.eyebrow', { range })}
        </Text>
        <Text testID={homeIds.weeklyTitle} variant="overlayTitle">
          {met ? t('weekly.headline') : t('weekly.headlineBelow')}
        </Text>
        <Text color="text2">
          {met
            ? t('weekly.subMet', { count: workouts, goal })
            : t('weekly.subBelow', { count: workouts, goal })}
        </Text>
      </VStack>

      <Box testID={homeIds.weeklyStats} direction="row" wrap="wrap" style={styles.statsGrid}>
        {stats.map((stat) => (
          <Box key={stat.key} style={styles.statCell}>
            <Card radius="xl" padding="ml" gap="xxs">
              <Text variant="caption" color="text2">
                {stat.label}
              </Text>
              <Text
                testID={`${homeIds.weeklyStats}.${stat.key}`}
                variant="heroSm"
                numberOfLines={1}
              >
                {stat.value}
              </Text>
              <Text variant="micro" color="text2">
                {stat.sub}
              </Text>
            </Card>
          </Box>
        ))}
      </Box>

      <Card testID={homeIds.weeklyDays} padding="lg" gap="sm">
        <Text variant="bodySemibold">{t('weekly.consistency')}</Text>
        <HStack gap="xs" align="stretch">
          {(w?.days ?? []).map((day, i) => (
            <Box
              key={day.day}
              flex={1}
              bg={DAY_COLORS[day.kind].bg}
              radius="sm"
              py="sm"
              align="center"
              gap="xs"
            >
              <Text variant="micro" color={DAY_COLORS[day.kind].fg}>
                {t(`weekly.days.${DAY_KEYS[i] ?? 'mon'}`)}
              </Text>
              <Text variant="smallBold" color={DAY_COLORS[day.kind].fg}>
                {day.label ?? DAY_GLYPHS[day.kind]}
              </Text>
            </Box>
          ))}
        </HStack>
        <Text variant="caption" color="text2">
          {t('weekly.restNote', { count: restDays })}
        </Text>
      </Card>

      <Text variant="secondarySemibold">{t('weekly.changes')}</Text>
      <Card testID={homeIds.weeklyChanges} padding="none" px="xl" gap="none">
        {changes.map((change, i) => (
          <Box
            key={change.id}
            direction="row"
            align="center"
            gap="md"
            borderColor="divider"
            style={[styles.changeRow, i === changes.length - 1 ? styles.lastRow : null]}
          >
            <Box
              bg={change.up ? 'brandTint' : 'fill2'}
              align="center"
              justify="center"
              style={styles.changeIcon}
            >
              <Text variant="smallBold" color={change.up ? 'brandText' : 'text2'}>
                {change.up ? '↑' : '='}
              </Text>
            </Box>
            <VStack flex={1} gap="xxs">
              <Text variant="bodySemibold">{change.title}</Text>
              <Text variant="caption" color="text2">
                {change.description}
              </Text>
            </VStack>
          </Box>
        ))}
      </Card>

      <Text variant="secondarySemibold">{t('weekly.highlights')}</Text>
      <Card testID={homeIds.weeklyHighlights} padding="none" px="xl" gap="none">
        {highlights.map((item, i) => (
          <HStack
            key={item.id}
            gap="sm"
            borderColor="divider"
            style={[styles.highlightRow, i === highlights.length - 1 ? styles.lastRow : null]}
          >
            <Chip label={item.tag} tone="ink" size="sm" />
            <Text variant="small">{item.text}</Text>
          </HStack>
        ))}
        {highlights.length === 0 ? (
          <HStack gap="sm" style={[styles.highlightRow, styles.lastRow]}>
            <Text variant="small" color="text2">
              {t('weekly.highlight.none')}
            </Text>
          </HStack>
        ) : null}
      </Card>

      <Card testID={homeIds.weeklyGoals} gap="ml">
        <Text variant="bodySemibold">{t('weekly.goals')}</Text>
        {goalRows.map((row) => (
          <VStack key={row.id} gap="sm">
            <HStack gap="sm" justify="space-between">
              <Text variant="small">{row.label}</Text>
              <Text variant="smallSemibold">{row.value}</Text>
            </HStack>
            <ProgressBar value={row.progress} />
          </VStack>
        ))}
      </Card>

      <Card testID={homeIds.weeklyPreview} variant="ink" padding="screen">
        <HStack gap="sm" justify="space-between" align="baseline">
          <Logo size={26} wordmark />
          <Text variant="caption" color="text2OnInk">
            {range}
          </Text>
        </HStack>
        <Text variant="heroMd" color="textOnInk">
          {t('weekly.preview.big', {
            workouts: t('weekly.homeWorkouts', { count: workouts }),
            km: one(km),
          })}
        </Text>
        <HStack gap="lg">
          <Text variant="secondary" color="text2OnInk">
            {t('weekly.preview.active', { time: activeTime(w?.activeSeconds ?? 0) })}
          </Text>
          <Text variant="secondary" color="text2OnInk">
            {t('weekly.preview.records', { count: records })}
          </Text>
          <Text variant="secondary" color="text2OnInk">
            {t('weekly.preview.days', { count: w?.activeDays ?? 0 })}
          </Text>
        </HStack>
        <Text variant="micro" color="text2OnInk">
          {t('weekly.preview.note')}
        </Text>
      </Card>

      <Button
        testID={homeIds.weeklyShare}
        label={t('weekly.share')}
        variant="surface"
        size="lg"
        fullWidth
        onPress={() => router.push('/share')}
      />
      <Text testID={homeIds.weeklyNote} variant="caption" color="text2">
        {t('weekly.note', { range: previousRange })}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsGrid: { marginHorizontal: -4 },
  statCell: { width: '50%', padding: 4 },
  changeRow: { minHeight: 62, borderBottomWidth: 1 },
  changeIcon: { width: 28, height: 28, borderRadius: 14 },
  highlightRow: { minHeight: 52, borderBottomWidth: 1 },
  lastRow: { borderBottomWidth: 0 },
});

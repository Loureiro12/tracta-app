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

import { formatNumber, useTranslation } from '@/shared/i18n';

import { useHomeGoals } from '../api/useHomeAccount';
import { homeIds } from '../home.testids';
import { weekly } from '../model/home.mock';
import { useHomeStore } from '../model/home.store';

import type { SemanticColors } from '@tracta/design-system';

const DAY_COLORS: Record<
  (typeof weekly.days)[number]['kind'],
  { bg: keyof SemanticColors; fg: keyof SemanticColors }
> = {
  strength: { bg: 'brand', fg: 'textOnBrand' },
  run: { bg: 'run', fg: 'textOnBrand' },
  rest: { bg: 'fill2', fg: 'text3' },
};

/** "Resumo semanal" full-screen overlay. */
export function WeeklyScreen() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const goals = useHomeGoals();
  const markWeeklySeen = useHomeStore((s) => s.markWeeklySeen);
  const sleepGoal = t('sleep.duration', {
    hours: Math.floor(goals.sleepMinutes / 60),
    minutes: String(goals.sleepMinutes % 60).padStart(2, '0'),
  });

  const close = () => {
    markWeeklySeen();
    router.back();
  };

  const stats = [
    {
      key: 'workouts',
      label: t('weekly.stats.workouts'),
      value: String(weekly.workouts),
      sub: t('weekly.stats.workoutsSub', { goal: goals.workouts }),
    },
    {
      key: 'active',
      label: t('weekly.stats.active'),
      value: weekly.activeTime,
      sub: t('weekly.stats.activeSub'),
    },
    {
      key: 'distance',
      label: t('weekly.stats.distance'),
      value: t('move.km', { value: formatNumber(weekly.distanceKm, { maximumFractionDigits: 1 }) }),
      sub: t('weekly.stats.distanceSub', { count: weekly.runs }),
    },
    {
      key: 'volume',
      label: t('weekly.stats.volume'),
      value: t('weekly.stats.volumeValue', {
        value: formatNumber(weekly.volumeTons, { maximumFractionDigits: 1 }),
      }),
      sub: t('weekly.stats.volumeSub', { count: weekly.strengthWorkouts }),
    },
  ];

  const goalRows = [
    {
      id: 'workouts',
      label: t('weekly.goal.workouts'),
      value: t('weekly.goal.workoutsValue', { goal: goals.workouts }),
    },
    {
      id: 'steps',
      label: t('weekly.goal.steps', { goal: formatNumber(goals.steps) }),
      value: t('weekly.goal.stepsValue'),
    },
    {
      id: 'sleep',
      label: t('weekly.goal.sleep', { goal: sleepGoal }),
      value: t('weekly.goal.sleepValue'),
    },
  ] as const;

  return (
    <Screen
      testID={homeIds.weeklyScreen}
      header={<BackHeader testID={homeIds.weeklyBack} label={t('weekly.back')} onPress={close} />}
    >
      <VStack gap="sm">
        <Text variant="captionBold" color="brandText" uppercase>
          {t('weekly.eyebrow', { range: t('weekly.range') })}
        </Text>
        <Text testID={homeIds.weeklyTitle} variant="overlayTitle">
          {t('weekly.headline')}
        </Text>
        <Text color="text2">{t('weekly.sub', { goal: goals.workouts })}</Text>
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
          {weekly.days.map((day) => (
            <Box
              key={day.id}
              flex={1}
              bg={DAY_COLORS[day.kind].bg}
              radius="sm"
              py="sm"
              align="center"
              gap="xs"
            >
              <Text variant="micro" color={DAY_COLORS[day.kind].fg}>
                {t(`weekly.days.${day.id}`)}
              </Text>
              <Text variant="smallBold" color={DAY_COLORS[day.kind].fg}>
                {day.label}
              </Text>
            </Box>
          ))}
        </HStack>
        <Text variant="caption" color="text2">
          {t('weekly.restNote')}
        </Text>
      </Card>

      <Text variant="secondarySemibold">{t('weekly.changes')}</Text>
      <Card testID={homeIds.weeklyChanges} padding="none" px="xl" gap="none">
        {weekly.changes.map((change, i) => (
          <Box
            key={change.id}
            direction="row"
            align="center"
            gap="md"
            borderColor="divider"
            style={[styles.changeRow, i === weekly.changes.length - 1 ? styles.lastRow : null]}
          >
            <Box
              bg={change.trend === 'up' ? 'brandTint' : 'fill2'}
              align="center"
              justify="center"
              style={styles.changeIcon}
            >
              <Text variant="smallBold" color={change.trend === 'up' ? 'brandText' : 'text2'}>
                {change.trend === 'up' ? '↑' : '='}
              </Text>
            </Box>
            <VStack flex={1} gap="xxs">
              <Text variant="bodySemibold">
                {t(`weekly.change.${change.id}.title`, {
                  value: formatNumber(weekly.averageSteps),
                })}
              </Text>
              <Text variant="caption" color="text2">
                {t(`weekly.change.${change.id}.description`)}
              </Text>
            </VStack>
          </Box>
        ))}
      </Card>

      <Text variant="secondarySemibold">{t('weekly.highlights')}</Text>
      <Card testID={homeIds.weeklyHighlights} padding="none" px="xl" gap="none">
        {weekly.highlights.map((item, i) => (
          <HStack
            key={item.id}
            gap="sm"
            borderColor="divider"
            style={[
              styles.highlightRow,
              i === weekly.highlights.length - 1 ? styles.lastRow : null,
            ]}
          >
            <Chip label={item.tag} tone="ink" size="sm" />
            <Text variant="small">{t(`weekly.highlight.${item.id}`)}</Text>
          </HStack>
        ))}
      </Card>

      <Card testID={homeIds.weeklyGoals} gap="ml">
        <Text variant="bodySemibold">{t('weekly.goals')}</Text>
        {weekly.goals.map((goal, i) => {
          const row = goalRows[i];
          if (!row) return null;
          return (
            <VStack key={goal.id} gap="sm">
              <HStack gap="sm" justify="space-between">
                <Text variant="small">{row.label}</Text>
                <Text variant="smallSemibold">{row.value}</Text>
              </HStack>
              <ProgressBar value={goal.progress} />
            </VStack>
          );
        })}
      </Card>

      <Card testID={homeIds.weeklyPreview} variant="ink" padding="screen">
        <HStack gap="sm" justify="space-between" align="baseline">
          <Logo size={26} wordmark />
          <Text variant="caption" color="text2OnInk">
            {t('weekly.range')}
          </Text>
        </HStack>
        <Text variant="heroMd" color="textOnInk">
          {t('weekly.preview.big')}
        </Text>
        <HStack gap="lg">
          <Text variant="secondary" color="text2OnInk">
            {t('weekly.preview.active')}
          </Text>
          <Text variant="secondary" color="text2OnInk">
            {t('weekly.preview.records')}
          </Text>
          <Text variant="secondary" color="text2OnInk">
            {t('weekly.preview.days')}
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
        {t('weekly.note', { range: t('weekly.previousRange') })}
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

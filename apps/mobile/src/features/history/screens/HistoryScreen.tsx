import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  HStack,
  Icon,
  Pressable,
  Screen,
  ScreenHeader,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { DayCard } from '../components/DayCard';
import { EvolutionCard } from '../components/EvolutionCard';
import { MonthCalendar } from '../components/MonthCalendar';
import { StatTile } from '../components/StatTile';
import { historyIds as ids } from '../history.testids';
import { historyHrefs } from '../lib/routes';
import { MONTH_RUN_KM, MONTH_VOLUME, MONTH_WORKOUTS_BASE } from '../model/history.mock';
import { useHistoryStore } from '../model/history.store';

import type { ViewStyle } from 'react-native';

type ReportRange = '7d' | '30d' | 'custom';

/** Histórico tab: recap + achievements entries, calendar with day detail, month stats, evolution. */
export function HistoryScreen() {
  const { t } = useTranslation('history');
  const router = useRouter();
  const theme = useTheme();
  const selectedDay = useHistoryStore((s) => s.selectedDay);
  const selectDay = useHistoryStore((s) => s.selectDay);
  const deleted = useHistoryStore((s) => s.deletedSessionIds);
  const monthCount = MONTH_WORKOUTS_BASE - deleted.length;

  const reportStyle = useMemo<ViewStyle>(
    () => ({
      flex: 1,
      height: 48,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.fill2,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [theme],
  );
  const reports: { range: ReportRange; testID: string }[] = [
    { range: '7d', testID: ids.report7d },
    { range: '30d', testID: ids.report30d },
    { range: 'custom', testID: ids.reportCustom },
  ];

  return (
    <Screen
      testID={ids.screen}
      bottomInset="tab"
      header={
        <ScreenHeader
          testID={ids.header}
          title={t('title')}
          actions={
            <Button
              testID={ids.share}
              label={t('header.share')}
              icon="share"
              size="xs"
              onPress={() => router.push(historyHrefs.share('month'))}
            />
          }
        />
      }
    >
      <Card
        testID={ids.recapOpen}
        variant="ink"
        px="xl"
        py="lg"
        onPress={() => router.push(historyHrefs.recap)}
        accessibilityLabel={t('recapCard.title')}
      >
        <HStack gap="md" justify="space-between">
          <VStack flex={1} gap="xxs">
            <Text variant="caption" color="text2OnInk">
              {t('recapCard.eyebrow')}
            </Text>
            <Text variant="stat" color="textOnInk" numberOfLines={1}>
              {t('recapCard.title')}
            </Text>
            <Text variant="secondary" color="text2OnInk" numberOfLines={1}>
              {t('recapCard.line')}
            </Text>
          </VStack>
          <Box bg="surface" radius="xl" px="ml" justify="center" style={styles.pill}>
            <Text variant="buttonXs">{t('recapCard.cta')}</Text>
          </Box>
        </HStack>
      </Card>

      <Card
        testID={ids.achievementsOpen}
        px="xl"
        py="ml"
        onPress={() => router.push(historyHrefs.achievements())}
        accessibilityLabel={t('achievementsCard.title')}
      >
        <HStack gap="md" justify="space-between">
          <VStack flex={1} gap="xxs">
            <Text variant="cardTitleSm">{t('achievementsCard.title')}</Text>
            <Text variant="secondary" color="text2">
              {t('achievementsCard.sub')}
            </Text>
          </VStack>
          <Icon name="chevron-right" size={16} color="text3" />
        </HStack>
      </Card>

      <MonthCalendar selectedDay={selectedDay} deletedSessionIds={deleted} onSelect={selectDay} />

      <DayCard
        day={selectedDay}
        deletedSessionIds={deleted}
        onOpenSession={(id) => router.push(historyHrefs.session(id))}
        onStartPlanned={() => router.push(historyHrefs.startSession)}
      />

      <HStack gap="sm" align="stretch">
        <StatTile
          testID={ids.statWorkouts}
          label={t('stats.workouts')}
          value={String(monthCount)}
        />
        <StatTile testID={ids.statRun} label={t('stats.run')} value={MONTH_RUN_KM} />
        <StatTile testID={ids.statVolume} label={t('stats.volume')} value={MONTH_VOLUME} />
      </HStack>

      <Card px="xl" py="lg" gap="md">
        <HStack justify="space-between" align="baseline" gap="sm">
          <Text variant="bodySemibold">{t('reports.title')}</Text>
          <Text variant="caption" color="text2" numberOfLines={1}>
            {t('reports.sub')}
          </Text>
        </HStack>
        <HStack gap="sm">
          {reports.map((r) => (
            <Pressable
              key={r.range}
              testID={r.testID}
              onPress={() => router.push(historyHrefs.report(r.range))}
              style={reportStyle}
            >
              <Text variant="smallBold">{t(`reports.${r.range}`)}</Text>
            </Pressable>
          ))}
        </HStack>
      </Card>

      <EvolutionCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pill: { height: 36 },
});

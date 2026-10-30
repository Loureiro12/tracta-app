import { useRouter } from 'expo-router';

import { Bars, Card, HStack, ProgressBar, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { CardHeaderRow } from './CardHeaderRow';
import { useHomeGoals } from '../api/useHomeAccount';
import { useHomeHealth } from '../api/useHomeHealth';
import { homeIds } from '../home.testids';

import type { Bar } from '@tracta/design-system';

const MIN_BAR_MINUTES = 300;
const BAR_RANGE_MINUTES = 240;

type SleepCardProps = { detailed: boolean };

/** "Sono · noite passada": duration vs goal, schedule window and (detailed) the last 7 nights. */
export function SleepCard({ detailed }: SleepCardProps) {
  const router = useRouter();
  const { t } = useTranslation('home');
  const goals = useHomeGoals();
  const { sleep } = useHomeHealth();
  const nightBars: Bar[] = (sleep?.nights ?? []).map((minutes, i, all) => ({
    value: Math.max(0, minutes - MIN_BAR_MINUTES),
    color: i === all.length - 1 ? 'sleep' : 'sleepLight',
  }));
  const duration = (minutes: number) =>
    t('sleep.duration', {
      hours: Math.floor(minutes / 60),
      minutes: String(minutes % 60).padStart(2, '0'),
    });

  return (
    <Card testID={homeIds.sleepCard} onPress={() => router.push('/health')}>
      <CardHeaderRow
        title={t('sleep.title')}
        dot="sleep"
        meta={
          <HStack gap="xs" align="baseline">
            <Text variant="caption" color="text2">
              {t('sleep.score')}
            </Text>
            <Text testID={homeIds.sleepScore} variant="bodyBold">
              {sleep?.score == null ? '—' : String(sleep.score)}
            </Text>
          </HStack>
        }
      />
      <HStack gap="sm" align="baseline">
        <Text testID={homeIds.sleepValue} variant="heroLg">
          {sleep ? duration(sleep.minutes) : '—'}
        </Text>
        <Text variant="secondary" color="text2" numberOfLines={1}>
          {t('sleep.goal', { goal: duration(goals.sleepMinutes) })}
        </Text>
      </HStack>
      <ProgressBar value={(sleep?.minutes ?? 0) / goals.sleepMinutes} color="sleep" />
      {sleep ? (
        <HStack gap="sm" justify="space-between">
          <Text variant="secondary" color="text2">
            {t('sleep.window', { start: sleep.bedtime ?? '—', end: sleep.wakeTime ?? '—' })}
          </Text>
          {sleep.regularityMinutes != null ? (
            <Text variant="secondary" color="text2">
              {t('sleep.regularity', { minutes: sleep.regularityMinutes })}
            </Text>
          ) : null}
        </HStack>
      ) : (
        <Text variant="secondary" color="text2">
          {t('sleep.empty')}
        </Text>
      )}
      {detailed ? (
        <Bars testID={homeIds.sleepBars} bars={nightBars} max={BAR_RANGE_MINUTES} height={44} />
      ) : null}
    </Card>
  );
}

import { useRouter } from 'expo-router';

import { Button, Card, HStack, Text, VStack } from '@tracta/design-system';

import { formatDate, formatNumber, useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';

import type { history } from '@tracta/api';

const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
};

/** "Última atividade" with the "Histórico" shortcut; hidden until something was logged. */
export function LastActivityCard({ entry }: { entry: history.HistoryEntry | null }) {
  const router = useRouter();
  const { t } = useTranslation('home');
  if (!entry) return null;
  const weekday = formatDate(new Date(entry.startedAt), { weekday: 'long' });
  const kind = t(
    `last.kinds.${entry.kind === 'strength' ? 'strength' : entry.kind === 'run' ? 'run' : 'other'}`,
  );
  const details =
    entry.kind === 'strength'
      ? t('last.strengthLine', {
          title: entry.title ?? '',
          minutes: Math.round(entry.durationSeconds / 60),
        })
      : entry.distanceM
        ? t('last.distanceLine', {
            km: formatNumber(entry.distanceM / 1000, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            }),
            time: clock(entry.durationSeconds),
            pace: clock(entry.durationSeconds / (entry.distanceM / 1000)),
          })
        : t('last.timeLine', { time: clock(entry.durationSeconds) });
  return (
    <Card testID={homeIds.lastCard} px="xl" py="lg">
      <HStack gap="md" justify="space-between">
        <VStack flex={1} gap="xxs">
          <Text variant="caption" color="text2">
            {t('last.title', {
              when: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${kind}`,
            })}
          </Text>
          <Text testID={homeIds.lastDetails} variant="cardTitleSm">
            {details}
          </Text>
        </VStack>
        <Button
          testID={homeIds.lastHistory}
          label={t('last.history')}
          variant="ghost"
          size="xs"
          onPress={() => router.push('/history')}
        />
      </HStack>
    </Card>
  );
}

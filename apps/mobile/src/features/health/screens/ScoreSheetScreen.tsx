import { useRouter } from 'expo-router';

import { Box, Card, Divider, HStack, Sheet, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { healthIds as ids } from '../health.testids';
import { useHealthData } from '../hooks/useHealthData';
import { sleepScore } from '../lib/derive';
import { hm } from '../lib/format';
import { SLEEP_FACTOR_KEYS, SLEEP_FACTOR_MAX } from '../model/health.constants';

import type { SleepFactorKey } from '../model/health.constants';

/** "Como calculamos" sheet: the four score factors with their weights and tonight's points. */
export function ScoreSheetScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const { get, todayKey, goals } = useHealthData();
  const score = sleepScore(get, todayKey, goals.sleepMinutes);
  const now = (key: SleepFactorKey) => {
    if (!score) return t('calc.empty');
    const pts = score.factors.find((f) => f.key === key)?.pts ?? 0;
    switch (key) {
      case 'duration':
        return t('calc.row.duration.now', {
          slept: hm(score.slept),
          goal: hm(goals.sleepMinutes),
          pts,
        });
      case 'regularity':
        return t('calc.row.regularity.now', { value: score.regularityMin, pts });
      case 'interruptions':
        return t('calc.row.interruptions.now', {
          count: score.wakeups,
          minutes: score.awakeMinutes,
          pts,
        });
      case 'consistency':
        return t('calc.row.consistency.now', { count: score.nights, pts });
    }
  };
  return (
    <Sheet
      testID={ids.scoreSheet}
      title={t('calc.title')}
      rightLabel={t('calc.close')}
      onClose={() => router.back()}
    >
      <Text variant="body">{t('calc.intro')}</Text>
      <Card testID={ids.scoreRow} variant="outline" px="xl" py="xxs" gap="none">
        {SLEEP_FACTOR_KEYS.map((key, i) => (
          <Box key={key}>
            <VStack testID={`${ids.scoreRow}.${key}`} gap="xs" py="ml">
              <HStack justify="space-between" gap="sm">
                <Text variant="bodySemibold">{t(`sleep.score.factor.${key}`)}</Text>
                <Text variant="secondaryBold" color="sleep">
                  {t('calc.upTo', { value: SLEEP_FACTOR_MAX[key] })}
                </Text>
              </HStack>
              <Text variant="secondary" color="text2">
                {t(`calc.row.${key}.description`)}
              </Text>
              <Text variant="captionSemibold">{t('calc.tonight', { value: now(key) })}</Text>
            </VStack>
            {i < SLEEP_FACTOR_KEYS.length - 1 ? <Divider /> : null}
          </Box>
        ))}
      </Card>
      <Card testID={ids.scoreOutside} variant="outline" px="xl" py="lg" gap="xs">
        <Text variant="bodySemibold">{t('calc.outside.title')}</Text>
        <Text variant="secondary" color="text2">
          {t('calc.outside.text')}
        </Text>
      </Card>
      <Text variant="caption" color="text2">
        {t('calc.note')}
      </Text>
    </Sheet>
  );
}

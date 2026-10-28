import { useRouter } from 'expo-router';

import { Box, Card, Divider, HStack, Sheet, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { healthIds as ids } from '../health.testids';
import { hm } from '../lib/format';
import { SLEEP_FACTORS, SLEEP_GOAL_MIN, SLEEP_LAST_NIGHT_MIN } from '../model/health.mock';

/** "Como calculamos" sheet: the four score factors with their weights and tonight's points. */
export function ScoreSheetScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  return (
    <Sheet
      testID={ids.scoreSheet}
      title={t('calc.title')}
      rightLabel={t('calc.close')}
      onClose={() => router.back()}
    >
      <Text variant="body">{t('calc.intro')}</Text>
      <Card testID={ids.scoreRow} variant="outline" px="xl" py="xxs" gap="none">
        {SLEEP_FACTORS.map((f, i) => (
          <Box key={f.key}>
            <VStack testID={`${ids.scoreRow}.${f.key}`} gap="xs" py="ml">
              <HStack justify="space-between" gap="sm">
                <Text variant="bodySemibold">{t(`sleep.score.factor.${f.key}`)}</Text>
                <Text variant="secondaryBold" color="sleep">
                  {t('calc.upTo', { value: f.max })}
                </Text>
              </HStack>
              <Text variant="secondary" color="text2">
                {t(`calc.row.${f.key}.description`)}
              </Text>
              <Text variant="captionSemibold">
                {t('calc.tonight', {
                  value: t(`calc.row.${f.key}.now`, {
                    slept: hm(SLEEP_LAST_NIGHT_MIN),
                    goal: hm(SLEEP_GOAL_MIN),
                  }),
                })}
              </Text>
            </VStack>
            {i < SLEEP_FACTORS.length - 1 ? <Divider /> : null}
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

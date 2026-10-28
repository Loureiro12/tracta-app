import { useRouter } from 'expo-router';

import { Box, Card, HStack, Sheet, Stepper, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useGoalLabels } from '../hooks/useGoalLabels';
import { GOAL_KEYS } from '../model/profile.mock';
import { useProfileStore } from '../model/profile.store';
import { profileIds as ids } from '../profile.testids';

/** "Metas" bottom sheet: one −/+ stepper per goal; "Concluir" closes and confirms with a toast. */
export function GoalsSheetScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const adjustGoal = useProfileStore((s) => s.adjustGoal);
  const labels = useGoalLabels();

  const done = () => {
    showToast(t('goals.updated'));
    router.back();
  };

  return (
    <Sheet
      testID={ids.goalsScreen}
      title={t('goals.title')}
      rightLabel={t('nav.done')}
      onPressRight={done}
      onClose={() => router.back()}
      maxHeight={0.75}
    >
      <VStack testID={ids.goalsRows} gap="sm">
        {GOAL_KEYS.map((key) => (
          <Card key={key} radius="pill" padding="ml" gap="none">
            <HStack gap="sm" justify="space-between">
              <VStack flex={1} gap="xxs">
                <Text variant="bodySemibold">{t(`goals.${key}.name`)}</Text>
                <Text variant="caption" color="text2">
                  {t(`goals.${key}.description`)}
                </Text>
              </VStack>
              <Box bg="bg" radius="md">
                <Stepper
                  testID={`${ids.goalsRows}.${key}`}
                  valueLabel={labels[key].stepper}
                  onDecrement={() => adjustGoal(key, -1)}
                  onIncrement={() => adjustGoal(key, 1)}
                  decrementLabel={t('goals.decrement')}
                  incrementLabel={t('goals.increment')}
                />
              </Box>
            </HStack>
          </Card>
        ))}
      </VStack>
      <Text variant="caption" color="text2">
        {t('goals.footnote')}
      </Text>
    </Sheet>
  );
}

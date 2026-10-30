import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Card,
  CheckCircle,
  HStack,
  Icon,
  Pressable,
  Text,
  VStack,
} from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { useHomeHealth } from '../api/useHomeHealth';
import { homeIds } from '../home.testids';
import { checklistSteps } from '../model/home.mock';

import type { HomeChecklistStepId } from '../model/home.mock';

/** Where each onboarding step sends the user. */
function pushStep(router: ReturnType<typeof useRouter>, id: HomeChecklistStepId) {
  switch (id) {
    case 'health':
      // Connecting Health lives in the connections screen (settings mode: back + "Done").
      router.push('/connect?mode=settings');
      return;
    case 'workout':
      router.push('/workouts');
      return;
    case 'friend':
      router.push('/social');
      return;
  }
}

/** "Comece por aqui": the three first steps shown to a brand-new account. */
export function ChecklistCard() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const { connected } = useHomeHealth();
  const steps = checklistSteps.map((s) => (s.id === 'health' ? { ...s, done: connected } : s));
  const done = steps.filter((s) => s.done).length;

  return (
    <Card testID={homeIds.checklistCard} gap="md">
      <HStack gap="sm" justify="space-between" align="baseline">
        <Text variant="cardTitle">{t('checklist.title')}</Text>
        <Text testID={homeIds.checklistProgress} variant="caption" color="text2">
          {t('checklist.progress', { done, total: steps.length })}
        </Text>
      </HStack>
      <Text variant="secondary" color="text2">
        {t('checklist.description')}
      </Text>
      <VStack testID={homeIds.checklistSteps} gap="none">
        {steps.map((step) => (
          <Pressable
            key={step.id}
            testID={`${homeIds.checklistSteps}.${step.id}`}
            onPress={() => pushStep(router, step.id)}
            accessibilityLabel={t(`checklist.steps.${step.id}.name`)}
            style={styles.step}
          >
            <Box borderColor="divider" style={styles.stepInner}>
              <CheckCircle
                testID={`${homeIds.checklistSteps}.${step.id}.check`}
                checked={step.done}
              />
              <VStack flex={1} gap="xxs">
                <Text variant="bodySemibold" color={step.done ? 'text3' : 'text'}>
                  {t(`checklist.steps.${step.id}.name`)}
                </Text>
                <Text variant="caption" color="text2">
                  {t(`checklist.steps.${step.id}.description`)}
                </Text>
              </VStack>
              <Icon name="chevron-right" size={14} color="text3" />
            </Box>
          </Pressable>
        ))}
      </VStack>
    </Card>
  );
}

const styles = StyleSheet.create({
  step: { minHeight: 52 },
  stepInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
  },
});

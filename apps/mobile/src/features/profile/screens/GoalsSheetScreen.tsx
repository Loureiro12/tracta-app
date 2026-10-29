import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Box, Card, HStack, Sheet, Stepper, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useUpdateGoals } from '../api/useAccountActions';
import { AccountGate } from '../components/AccountGate';
import { toAccountGoals, toGoalValues, useGoalLabels } from '../hooks/useGoalLabels';
import { GOAL_KEYS, GOAL_STEPS } from '../model/profile.mock';
import { profileIds as ids } from '../profile.testids';

import type { GoalKey, Goals } from '../model/profile.types';
import type { Account } from '@/shared/api';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** "Metas" bottom sheet: one −/+ stepper per goal; "Concluir" saves and confirms with a toast. */
export function GoalsSheetScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const updateGoals = useUpdateGoals();
  const [draft, setDraft] = useState<Goals | null>(null);

  const done = () => {
    if (!draft) return router.back();
    updateGoals.mutate(toAccountGoals(draft), {
      onSuccess: () => {
        showToast(t('goals.updated'));
        router.back();
      },
      onError: () => showToast(t('state.saveFailed')),
    });
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
      <AccountGate testID={ids.goalsScreen}>
        {(account) => <GoalRows account={account} draft={draft} onChange={setDraft} />}
      </AccountGate>
      <Text variant="caption" color="text2">
        {t('goals.footnote')}
      </Text>
    </Sheet>
  );
}

type GoalRowsProps = {
  account: Account;
  /** Unsaved values; null until the first tap (then the server values are the base). */
  draft: Goals | null;
  onChange: (goals: Goals) => void;
};

function GoalRows({ account, draft, onChange }: GoalRowsProps) {
  const { t } = useTranslation('profile');
  const goals = draft ?? toGoalValues(account.goals);
  const labels = useGoalLabels(goals);

  const adjust = (key: GoalKey, direction: 1 | -1) => {
    const { step, min, max } = GOAL_STEPS[key];
    onChange({ ...goals, [key]: clamp(goals[key] + direction * step, min, max) });
  };

  return (
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
                onDecrement={() => adjust(key, -1)}
                onIncrement={() => adjust(key, 1)}
                decrementLabel={t('goals.decrement')}
                incrementLabel={t('goals.increment')}
              />
            </Box>
          </HStack>
        </Card>
      ))}
    </VStack>
  );
}

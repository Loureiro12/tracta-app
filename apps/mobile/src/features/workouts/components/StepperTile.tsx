import { Box, Stepper, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import type { SemanticColors } from '@tracta/design-system';

/** Labelled −/+ tile (sets, reps, load, rest, interval settings). */
export function StepperTile({
  testID,
  label,
  valueLabel,
  onDecrement,
  onIncrement,
  bg = 'surface',
}: {
  testID: string;
  label: string;
  valueLabel: string;
  onDecrement: () => void;
  onIncrement: () => void;
  bg?: Extract<keyof SemanticColors, 'surface' | 'bg'>;
}) {
  const { t } = useTranslation('workouts');
  return (
    <Box flex={1} bg={bg} radius="md" pt="sm" pb="xs" px="xs" align="center" gap="xxs">
      <Text variant="micro" color="text2" numberOfLines={1}>
        {label}
      </Text>
      <Stepper
        testID={testID}
        valueLabel={valueLabel}
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        decrementLabel={t('stepper.decrease', { label })}
        incrementLabel={t('stepper.increase', { label })}
      />
    </Box>
  );
}

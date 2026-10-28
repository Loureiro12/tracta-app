import { IconButton } from '../IconButton/IconButton';
import { HStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';

export type StepperProps = Testable & {
  /** Formatted value shown between the buttons. */
  valueLabel: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel: string;
  incrementLabel: string;
  disabled?: boolean;
};

/** −/+ stepper with 44px touch targets, used for load, reps and interval settings. */
export function Stepper({
  valueLabel,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
  disabled = false,
  testID,
}: StepperProps) {
  return (
    <HStack testID={testID} gap="sm">
      <IconButton
        testID={`${testID}.minus`}
        icon="minus"
        label={decrementLabel}
        size={44}
        onPress={onDecrement}
        disabled={disabled}
      />
      <Text testID={`${testID}.value`} variant="stat" tabular align="center">
        {valueLabel}
      </Text>
      <IconButton
        testID={`${testID}.plus`}
        icon="plus"
        label={incrementLabel}
        size={44}
        onPress={onIncrement}
        disabled={disabled}
      />
    </HStack>
  );
}

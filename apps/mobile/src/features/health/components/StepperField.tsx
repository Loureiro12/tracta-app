import { useMemo } from 'react';

import { Box, HStack, IconButton, Text, TextField } from '@tracta/design-system';

type Props = {
  label: string;
  /** Current value as text (editable). */
  value: string;
  onChangeText: (text: string) => void;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel: string;
  incrementLabel: string;
  unit?: string;
  testID: string;
};

/**
 * White 14px box with a small label and a −/+ stepper whose value is an editable numeric field
 * (`${testID}.input` for Maestro's inputText, `${testID}.minus` / `${testID}.plus` to step).
 */
export function StepperField({
  label,
  value,
  onChangeText,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
  unit,
  testID,
}: Props) {
  const boxStyle = useMemo(() => ({ paddingTop: 8, paddingBottom: 6, paddingHorizontal: 6 }), []);
  return (
    <Box testID={testID} bg="surface" radius="md" align="center" gap="xxs" style={boxStyle}>
      <Text testID={`${testID}.label`} variant="micro" color="text2" numberOfLines={1}>
        {label}
      </Text>
      <HStack gap="none" align="center">
        <IconButton
          testID={`${testID}.minus`}
          icon="minus"
          label={decrementLabel}
          size={44}
          variant="surface"
          onPress={onDecrement}
        />
        <Box flex={1}>
          <TextField
            testID={`${testID}.field`}
            value={value}
            onChangeText={onChangeText}
            keyboardType="decimal-pad"
            selectTextOnFocus
            textAlign="center"
            {...(unit
              ? {
                  trailing: (
                    <Text variant="caption" color="text2">
                      {unit}
                    </Text>
                  ),
                }
              : {})}
          />
        </Box>
        <IconButton
          testID={`${testID}.plus`}
          icon="plus"
          label={incrementLabel}
          size={44}
          variant="surface"
          onPress={onIncrement}
        />
      </HStack>
    </Box>
  );
}

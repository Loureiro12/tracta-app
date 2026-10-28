import { useMemo } from 'react';

import { Box, Icon, Pressable, Text, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

type Props = {
  testID: string;
  value: string;
  unit: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel: string;
  incrementLabel: string;
};

/** fill-1 stepper from the handoff: 44px square −/+ buttons around a condensed value + unit. */
export function LoadStepper({
  testID,
  value,
  unit,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
}: Props) {
  const theme = useTheme();
  const buttonStyle = useMemo<ViewStyle>(
    () => ({
      width: 44,
      height: 44,
      borderRadius: theme.radii.sm,
      backgroundColor: theme.colors.track,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [theme],
  );
  return (
    <Box testID={testID} bg="fill1" radius="md" p="xs" direction="row" align="center" flex={1}>
      <Pressable
        testID={`${testID}.minus`}
        onPress={onDecrement}
        accessibilityLabel={decrementLabel}
        style={buttonStyle}
      >
        <Icon name="minus" size={20} />
      </Pressable>
      <Box flex={1} align="center">
        <Text testID={`${testID}.value`} variant="nameTitle" tabular numberOfLines={1}>
          {value}
        </Text>
        <Text variant="micro" color="text2">
          {unit}
        </Text>
      </Box>
      <Pressable
        testID={`${testID}.plus`}
        onPress={onIncrement}
        accessibilityLabel={incrementLabel}
        style={buttonStyle}
      >
        <Icon name="plus" size={20} />
      </Pressable>
    </Box>
  );
}

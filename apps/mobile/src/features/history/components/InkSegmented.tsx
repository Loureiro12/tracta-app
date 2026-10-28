import { useMemo } from 'react';

import { Box, Pressable, Text, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

export type InkSegmentedOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  testID: string;
  options: readonly InkSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Segmented control on a fill-2 track whose selected segment is an ink pill (prototype's
 * "Musculação / Cardio" toggle). The design-system `Segmented` uses a white pill instead.
 * Option testIDs: `<testID>.<value>`.
 */
export function InkSegmented<T extends string>({ testID, options, value, onChange }: Props<T>) {
  const theme = useTheme();
  const trackStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.fill2,
      borderRadius: 12,
      padding: 3,
      gap: 3,
      flexDirection: 'row',
    }),
    [theme],
  );
  const selectedStyle = useMemo<ViewStyle>(
    () => ({ backgroundColor: theme.colors.ink, borderRadius: 9 }),
    [theme],
  );
  const segmentStyle = useMemo<ViewStyle>(
    () => ({ flex: 1, height: 34, alignItems: 'center', justifyContent: 'center' }),
    [],
  );
  return (
    <Box testID={testID} style={trackStyle} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            testID={`${testID}.${option.value}`}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[segmentStyle, selected ? selectedStyle : null]}
          >
            <Text variant="secondarySemibold" color={selected ? 'textOnInk' : 'text2'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );
}

import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Pressable } from '../Pressable/Pressable';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { ViewStyle } from 'react-native';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = Testable & {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Segmented control on a fill-3 track; the selected segment is a white pill. Option testIDs: `<testID>.<value>`. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  testID,
}: SegmentedProps<T>) {
  const theme = useTheme();
  const trackStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.fill3,
      borderRadius: theme.radii.md,
      padding: 3,
      flexDirection: 'row',
    }),
    [theme],
  );
  const selectedStyle = useMemo<ViewStyle>(
    () => ({ backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm }),
    [theme],
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
            style={[styles.segment, selected ? selectedStyle : null]}
          >
            <Text
              variant={selected ? 'smallBold' : 'smallSemibold'}
              color={selected ? 'text' : 'text2'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );
}

const styles = {
  segment: { flex: 1, height: 32, alignItems: 'center', justifyContent: 'center' } as const,
};

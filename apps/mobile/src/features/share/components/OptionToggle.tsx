import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, Pressable, Text, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

export type OptionToggleProps = {
  label: string;
  checked: boolean;
  onPress: () => void;
  testID: string;
};

/** 32px checkbox chip ("Mostrar cargas"): brand tint when on, white with hairline when off. */
export function OptionToggle({ label, checked, onPress, testID }: OptionToggleProps) {
  const theme = useTheme();
  const chipStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: checked ? theme.colors.brandTint : theme.colors.surface,
      borderColor: checked ? 'transparent' : theme.colors.outline,
      borderRadius: theme.radii.sm,
      paddingHorizontal: 11,
      gap: 6,
    }),
    [theme, checked],
  );
  const boxStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: checked ? theme.colors.brand : 'transparent',
      borderColor: checked ? theme.colors.brand : theme.colors.switchOff,
    }),
    [theme, checked],
  );
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={[styles.chip, chipStyle]}
    >
      <Box style={[styles.box, boxStyle]} />
      <Text variant="captionSemibold" color={checked ? 'brandDark' : 'text2'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: 32, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  box: { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5 },
});

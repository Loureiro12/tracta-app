import { useMemo } from 'react';

import { Pressable, Text, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

type Props = {
  cheered: boolean;
  label: string;
  onPress: () => void;
  testID: string;
};

/** 36px pill: ink when idle, brand tint once the friend was cheered. */
export function CheerButton({ cheered, label, onPress, testID }: Props) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      height: 36,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: cheered ? theme.colors.brandTint : theme.colors.ink,
    }),
    [theme, cheered],
  );
  return (
    <Pressable testID={testID} onPress={onPress} style={style} accessibilityLabel={label}>
      <Text
        testID={`${testID}.label`}
        variant="buttonXs"
        color={cheered ? 'brand' : 'textOnInk'}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

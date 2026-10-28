import { useMemo } from 'react';

import { Pressable, Text, useTheme } from '@tracta/design-system';

/** Rounded selectable pill (38px): white with hairline, ink when selected. */
export function SelectChip({
  testID,
  label,
  selected,
  onPress,
  height = 38,
  flex = false,
}: {
  testID: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  height?: number;
  flex?: boolean;
}) {
  const theme = useTheme();
  const style = useMemo(
    () => ({
      height,
      borderRadius: height / 2,
      paddingHorizontal: theme.spacing.ml,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: selected ? theme.colors.ink : theme.colors.surface,
      borderWidth: 1,
      borderColor: selected ? theme.colors.ink : theme.colors.outline,
      flex: flex ? 1 : undefined,
    }),
    [theme, selected, height, flex],
  );
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={style}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text
        variant="secondarySemibold"
        color={selected ? 'textOnInk' : 'text'}
        numberOfLines={1}
        align="center"
      >
        {label}
      </Text>
    </Pressable>
  );
}

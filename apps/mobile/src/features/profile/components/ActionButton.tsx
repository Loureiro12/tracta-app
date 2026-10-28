import { useMemo } from 'react';

import { Pressable, Text, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

type ActionButtonProps = {
  testID: string;
  label: string;
  onPress: () => void;
  /** Danger renders the label in the destructive color and drops the hairline (handoff "Sair"). */
  tone?: 'default' | 'danger';
  /** Hide the 1px outline (default: outlined). */
  outlined?: boolean;
};

/** 50px white button with 16px radius and a hairline: the handoff's full-width profile actions. */
export function ActionButton({
  testID,
  label,
  onPress,
  tone = 'default',
  outlined = tone !== 'danger',
}: ActionButtonProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      height: 50,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: outlined ? theme.colors.outline : theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    }),
    [theme, outlined],
  );
  return (
    <Pressable testID={testID} onPress={onPress} style={style} accessibilityLabel={label}>
      <Text
        testID={`${testID}.label`}
        variant="bodyBold"
        color={tone === 'danger' ? 'danger' : 'text'}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

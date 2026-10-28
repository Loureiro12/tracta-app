import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Icon } from '../Icon/Icon';
import { Pressable } from '../Pressable/Pressable';

import type { Testable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { ViewStyle } from 'react-native';

export type CheckCircleProps = Testable & {
  checked: boolean;
  /** Fill color when checked. Default brand; success for completed sets. */
  color?: keyof SemanticColors;
  /** Diameter, default 26. */
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Round checkbox (checklist steps, "série feita"). */
export function CheckCircle({
  checked,
  color = 'brand',
  size = 26,
  onPress,
  accessibilityLabel,
  testID,
}: CheckCircleProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: checked ? theme.colors[color] : 'transparent',
      borderWidth: 1.5,
      borderColor: checked ? theme.colors[color] : theme.colors.dividerStrong,
    }),
    [theme, checked, color, size],
  );
  const mark = checked ? (
    <Icon name="check" size={Math.round(size * 0.5)} color="textOnBrand" />
  ) : null;
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        style={style}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
      >
        {mark}
      </Pressable>
    );
  }
  return (
    <Box testID={testID} style={style}>
      {mark}
    </Box>
  );
}

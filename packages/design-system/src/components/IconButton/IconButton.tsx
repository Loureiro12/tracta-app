import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Badge } from '../Badge/Badge';
import { Box } from '../Box/Box';
import { Icon } from '../Icon/Icon';
import { Pressable } from '../Pressable/Pressable';

import type { Testable } from '../../testing/test-id';
import type { IconName } from '../Icon/Icon';
import type { PressableProps, ViewStyle } from 'react-native';

export type IconButtonVariant = 'fill' | 'surface' | 'ink';

export type IconButtonProps = Testable & {
  icon: IconName;
  /** Accessibility label; mandatory because the button has no visible text. */
  label: string;
  onPress: NonNullable<PressableProps['onPress']>;
  variant?: IconButtonVariant;
  /** Diameter. Default 40 (handoff header buttons). */
  size?: number;
  /** Unread count shown as a red badge. */
  badge?: number;
  disabled?: boolean;
};

/** Round icon button (40px, fill-1) used in headers and toolbars. */
export function IconButton({
  icon,
  label,
  onPress,
  variant = 'fill',
  size = 40,
  badge,
  disabled = false,
  testID,
}: IconButtonProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        variant === 'ink'
          ? theme.colors.ink
          : variant === 'surface'
            ? theme.colors.surface
            : theme.colors.fill1,
      borderWidth: variant === 'surface' ? 1 : 0,
      borderColor: theme.colors.outline,
      opacity: disabled ? 0.5 : 1,
    }),
    [theme, size, variant, disabled],
  );
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={style}
    >
      <Icon
        name={icon}
        size={Math.round(size * 0.45)}
        color={variant === 'ink' ? 'textOnInk' : 'text'}
      />
      {badge !== undefined && badge > 0 ? (
        <Box testID={`${testID}.badge`} style={styles.badge}>
          <Badge count={badge} />
        </Box>
      ) : null}
    </Pressable>
  );
}

const styles = {
  badge: { position: 'absolute', top: 2, right: 1 } as const,
};

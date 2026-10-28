import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Pressable } from '../Pressable/Pressable';

import type { MaybeTestable } from '../../testing/test-id';
import type { RadiusToken } from '../../tokens/radii';
import type { SpacingToken } from '../../tokens/spacing';
import type { ReactNode } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';

export type CardVariant = 'surface' | 'ink' | 'outline' | 'tint' | 'warn' | 'social' | 'fill';

export type CardProps = MaybeTestable & {
  children: ReactNode;
  variant?: CardVariant;
  /** Inner padding token. Default xl (18). */
  padding?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  /** Vertical gap between children. Default md (12). */
  gap?: SpacingToken;
  radius?: RadiusToken;
  /** Makes the whole card tappable (role button). */
  onPress?: NonNullable<PressableProps['onPress']>;
  accessibilityLabel?: string;
};

/** White rounded card (22px) from the handoff, with the dark/outline/tint variants. */
export function Card({
  children,
  variant = 'surface',
  padding = 'xl',
  px,
  py,
  gap = 'md',
  radius = 'card',
  onPress,
  accessibilityLabel,
  testID,
}: CardProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(() => {
    const c = theme.colors;
    const base: ViewStyle = {
      borderRadius: theme.radii[radius],
      padding: theme.spacing[padding],
      paddingHorizontal: px ? theme.spacing[px] : undefined,
      paddingVertical: py ? theme.spacing[py] : undefined,
      gap: theme.spacing[gap],
      borderWidth: 1,
      borderColor: 'transparent',
    };
    switch (variant) {
      case 'ink':
        return { ...base, backgroundColor: c.ink };
      case 'outline':
        return { ...base, backgroundColor: c.surface, borderColor: c.dividerStrong };
      case 'tint':
        return { ...base, backgroundColor: c.brandTint };
      case 'warn':
        return { ...base, backgroundColor: c.warnBg };
      case 'social':
        return { ...base, backgroundColor: c.socialBg };
      case 'fill':
        return { ...base, backgroundColor: c.fill2 };
      default:
        return { ...base, backgroundColor: c.surface };
    }
  }, [theme, variant, padding, px, py, gap, radius]);

  if (onPress) {
    return (
      <Pressable
        testID={testID ?? 'ds.card.pressable'}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        style={style}
        pressedOpacity={0.85}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <Box testID={testID} style={style}>
      {children}
    </Box>
  );
}

import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Text } from '../Text/Text';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { TypographyVariant } from '../../tokens/typography';

export type AvatarProps = MaybeTestable & {
  /** Initial(s) rendered in the circle. */
  initial: string;
  /** Diameter: 28 (lists), 40 (headers), 56 (profile). */
  size?: 28 | 40 | 56;
  bg?: keyof SemanticColors;
  color?: keyof SemanticColors;
};

const variantBySize: Record<NonNullable<AvatarProps['size']>, TypographyVariant> = {
  28: 'captionBold',
  40: 'bodyBold',
  56: 'cardTitle',
};

/** Letter avatar used for the user and friends. */
export function Avatar({ initial, size = 40, bg = 'fill1', color = 'text', testID }: AvatarProps) {
  const theme = useTheme();
  const style = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.colors[bg],
    }),
    [size, theme, bg],
  );
  return (
    <Box testID={testID} align="center" justify="center" style={style}>
      <Text variant={variantBySize[size]} color={color} uppercase>
        {initial}
      </Text>
    </Box>
  );
}

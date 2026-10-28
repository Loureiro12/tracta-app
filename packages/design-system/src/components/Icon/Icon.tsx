import { Feather } from '@expo/vector-icons';

import { useTheme } from '../../theme/ThemeProvider';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';

export type IconName = keyof typeof Feather.glyphMap;

export type IconProps = MaybeTestable & {
  name: IconName;
  /** Default 18 (round icon buttons); tab bar uses 24. */
  size?: number;
  color?: keyof SemanticColors;
};

/** Line icons (Feather, stroke ~2, rounded caps) matching the handoff's inline SVGs. */
export function Icon({ name, size = 18, color = 'text', testID }: IconProps) {
  const theme = useTheme();
  return <Feather name={name} size={size} color={theme.colors[color]} testID={testID} />;
}

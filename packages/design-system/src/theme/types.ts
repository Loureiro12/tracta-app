import type { SemanticColors } from '../tokens/colors';
import type { radii } from '../tokens/radii';
import type { shadows } from '../tokens/shadows';
import type { spacing } from '../tokens/spacing';
import type { typography } from '../tokens/typography';

export type ColorScheme = 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;
  colors: SemanticColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  shadows: typeof shadows;
};

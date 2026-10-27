import { darkColors, lightColors } from '../tokens/colors';
import { radii } from '../tokens/radii';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

import type { Theme } from './types';

export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  spacing,
  radii,
  typography,
  shadows,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: darkColors,
  spacing,
  radii,
  typography,
  shadows,
};

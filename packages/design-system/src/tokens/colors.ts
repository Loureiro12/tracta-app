/**
 * Raw palette. Never import this file from components or the app:
 * use semantic colors from the theme (`useTheme().colors`).
 */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
  gray950: '#020617',

  brand50: '#EEF2FF',
  brand100: '#E0E7FF',
  brand300: '#A5B4FC',
  brand500: '#6366F1',
  brand600: '#4F46E5',
  brand700: '#4338CA',

  green100: '#DCFCE7',
  green500: '#22C55E',
  green700: '#15803D',

  amber100: '#FEF3C7',
  amber500: '#F59E0B',
  amber700: '#B45309',

  red100: '#FEE2E2',
  red500: '#EF4444',
  red700: '#B91C1C',
} as const;

export type PaletteColor = keyof typeof palette;

/** Semantic color roles. Every theme must provide all of them. */
export type SemanticColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textOnBrand: string;

  brand: string;
  brandHover: string;
  brandSubtle: string;

  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;

  focusRing: string;
  overlay: string;
};

export const lightColors: SemanticColors = {
  background: palette.white,
  surface: palette.gray50,
  surfaceElevated: palette.white,
  border: palette.gray200,
  borderStrong: palette.gray300,

  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  textInverse: palette.white,
  textOnBrand: palette.white,

  brand: palette.brand600,
  brandHover: palette.brand700,
  brandSubtle: palette.brand50,

  success: palette.green700,
  successSubtle: palette.green100,
  warning: palette.amber700,
  warningSubtle: palette.amber100,
  danger: palette.red700,
  dangerSubtle: palette.red100,

  focusRing: palette.brand300,
  overlay: 'rgba(2, 6, 23, 0.55)',
};

export const darkColors: SemanticColors = {
  background: palette.gray950,
  surface: palette.gray900,
  surfaceElevated: palette.gray800,
  border: palette.gray800,
  borderStrong: palette.gray700,

  textPrimary: palette.gray50,
  textSecondary: palette.gray300,
  textMuted: palette.gray500,
  textInverse: palette.gray900,
  textOnBrand: palette.white,

  brand: palette.brand500,
  brandHover: palette.brand300,
  brandSubtle: palette.gray800,

  success: palette.green500,
  successSubtle: palette.gray800,
  warning: palette.amber500,
  warningSubtle: palette.gray800,
  danger: palette.red500,
  dangerSubtle: palette.gray800,

  focusRing: palette.brand300,
  overlay: 'rgba(0, 0, 0, 0.7)',
};

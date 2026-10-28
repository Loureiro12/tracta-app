/**
 * Raw palette from the Tracta handoff (design_handoff_tracta_app/README.md).
 * Never import this file from components or the app: use `useTheme().colors`.
 */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  brand: '#D8613C',
  brandText: '#B4482A',
  brandDark: '#8F3A22',
  brandTint: '#FBE5DC',
  brandOnDark: '#F0A487',

  ink: '#1A1A17',
  ink2: '#1F1F1C',
  ink3: '#2A2A26',
  ink4: '#3E3D38',
  sand: '#F2EEE6',
  fill1: '#E8E2D6',
  fill2: '#EBE5DA',
  fill3: '#E5DFD2',
  track: '#E3DDD0',
  switchOff: '#DAD3C5',
  frame: '#D9D3C6',
  text2: '#6B6A63',
  text3: '#8F8E86',
  text4: '#4A4943',
  sandOnDark: '#CFCBBE',
  sandMutedOnDark: '#A8A496',

  danger: '#B3261E',
  success: '#1F6F5C',
  successTint: '#E3EFEA',
  warnText: '#8A6100',
  warnBg: '#FBF1D6',
  run: '#2E86C1',
  runLight: '#8EC3E6',
  sleep: '#5B5FD6',
  sleepLight: '#D7D8F3',
  social: '#4B4FC4',
  socialBg: '#E7E4FA',
  heart: '#FF7A59',
  challenge: '#D9822B',
  gold: '#F5D36B',
} as const;

export type PaletteColor = keyof typeof palette;

/** Semantic color roles. Every theme must provide all of them. */
export type SemanticColors = {
  /** Screen background (sand). */
  bg: string;
  /** Cards. */
  surface: string;
  /** Dark cards, primary buttons, toasts. */
  ink: string;
  /** Neutral buttons, pills, round icon buttons. */
  fill1: string;
  /** Segmented controls, chips. */
  fill2: string;
  /** Segmented track. */
  fill3: string;
  /** Progress bar track. */
  track: string;
  /** Switch off, sheet handle. */
  switchOff: string;
  /** 1px dividers. */
  divider: string;
  dividerStrong: string;
  /** Card outline. */
  outline: string;

  text: string;
  text2: string;
  text3: string;
  textOnInk: string;
  text2OnInk: string;
  textOnBrand: string;

  brand: string;
  brandText: string;
  brandDark: string;
  brandTint: string;
  brandOnDark: string;

  danger: string;
  success: string;
  successTint: string;
  warnText: string;
  warnBg: string;
  run: string;
  runLight: string;
  sleep: string;
  sleepLight: string;
  social: string;
  socialBg: string;
  heart: string;
  challenge: string;

  overlay: string;
  tabBar: string;
};

export const lightColors: SemanticColors = {
  bg: palette.sand,
  surface: palette.white,
  ink: palette.ink,
  fill1: palette.fill1,
  fill2: palette.fill2,
  fill3: palette.fill3,
  track: palette.track,
  switchOff: palette.switchOff,
  divider: 'rgba(26,26,23,0.07)',
  dividerStrong: 'rgba(26,26,23,0.14)',
  outline: 'rgba(26,26,23,0.10)',

  text: palette.ink,
  text2: palette.text2,
  text3: palette.text3,
  textOnInk: palette.white,
  text2OnInk: 'rgba(255,255,255,0.72)',
  textOnBrand: palette.white,

  brand: palette.brand,
  brandText: palette.brandText,
  brandDark: palette.brandDark,
  brandTint: palette.brandTint,
  brandOnDark: palette.brandOnDark,

  danger: palette.danger,
  success: palette.success,
  successTint: palette.successTint,
  warnText: palette.warnText,
  warnBg: palette.warnBg,
  run: palette.run,
  runLight: palette.runLight,
  sleep: palette.sleep,
  sleepLight: palette.sleepLight,
  social: palette.social,
  socialBg: palette.socialBg,
  heart: palette.heart,
  challenge: palette.challenge,

  overlay: 'rgba(26,26,23,0.55)',
  tabBar: 'rgba(242,238,230,0.92)',
};

/** The handoff ships light only; dark is a conservative inversion of the same roles. */
export const darkColors: SemanticColors = {
  bg: '#141412',
  surface: palette.ink2,
  ink: palette.sand,
  fill1: palette.ink3,
  fill2: palette.ink3,
  fill3: '#24241F',
  track: palette.ink4,
  switchOff: palette.ink4,
  divider: 'rgba(242,238,230,0.08)',
  dividerStrong: 'rgba(242,238,230,0.16)',
  outline: 'rgba(242,238,230,0.12)',

  text: palette.sand,
  text2: palette.sandOnDark,
  text3: palette.sandMutedOnDark,
  textOnInk: palette.ink,
  text2OnInk: 'rgba(26,26,23,0.72)',
  textOnBrand: palette.white,

  brand: palette.brand,
  brandText: palette.brandOnDark,
  brandDark: palette.brandTint,
  brandTint: '#3A251C',
  brandOnDark: palette.brandOnDark,

  danger: '#E5584F',
  success: '#4FB08F',
  successTint: '#17342C',
  warnText: palette.gold,
  warnBg: '#3A2E0E',
  run: palette.runLight,
  runLight: palette.run,
  sleep: '#8A8DE8',
  sleepLight: '#2B2C5A',
  social: '#9A9DF0',
  socialBg: '#26275A',
  heart: palette.heart,
  challenge: palette.challenge,

  overlay: 'rgba(0,0,0,0.7)',
  tabBar: 'rgba(20,20,18,0.92)',
};

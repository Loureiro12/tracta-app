import type { TextStyle } from 'react-native';

/**
 * Archivo static instances embedded by the app (apps/mobile/assets/fonts).
 * The suffix is the `wdth` axis value the handoff uses via `font-stretch`.
 */
export const fontFamilies = {
  regular: 'Archivo100-Regular',
  medium: 'Archivo100-Medium',
  semibold: 'Archivo100-SemiBold',
  bold: 'Archivo100-Bold',
  extrabold: 'Archivo100-ExtraBold',
  /** font-stretch 80% · screen titles, stats */
  condensed80Bold: 'Archivo80-Bold',
  /** font-stretch 75% · overlay titles, hero numbers */
  condensed75Bold: 'Archivo75-Bold',
  condensed75ExtraBold: 'Archivo75-ExtraBold',
  /** font-stretch 70% · very large hero numbers */
  condensed70Bold: 'Archivo70-Bold',
  condensed70ExtraBold: 'Archivo70-ExtraBold',
  /** font-stretch 112% · TRACTA wordmark */
  expanded112ExtraBold: 'Archivo112-ExtraBold',
} as const;

export const fontAssets = {
  [fontFamilies.regular]: 'Archivo100-Regular.ttf',
  [fontFamilies.medium]: 'Archivo100-Medium.ttf',
  [fontFamilies.semibold]: 'Archivo100-SemiBold.ttf',
  [fontFamilies.bold]: 'Archivo100-Bold.ttf',
  [fontFamilies.extrabold]: 'Archivo100-ExtraBold.ttf',
  [fontFamilies.condensed80Bold]: 'Archivo80-Bold.ttf',
  [fontFamilies.condensed75Bold]: 'Archivo75-Bold.ttf',
  [fontFamilies.condensed75ExtraBold]: 'Archivo75-ExtraBold.ttf',
  [fontFamilies.condensed70Bold]: 'Archivo70-Bold.ttf',
  [fontFamilies.condensed70ExtraBold]: 'Archivo70-ExtraBold.ttf',
  [fontFamilies.expanded112ExtraBold]: 'Archivo112-ExtraBold.ttf',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/** Type ramp from the handoff. Each variant is a complete, self-contained text style. */
export const typography = {
  /** Sticky screen header title: 30 / 700 / stretch 80% */
  screenTitle: {
    fontFamily: fontFamilies.condensed80Bold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  /** Full-screen overlay title: 36 / 800 / stretch 75% */
  overlayTitle: {
    fontFamily: fontFamilies.condensed75ExtraBold,
    fontSize: 36,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  /** Hero numbers (timers, distance): tabular */
  heroXl: {
    fontFamily: fontFamilies.condensed70ExtraBold,
    fontSize: 96,
    lineHeight: 84,
    fontVariant: tabular,
  },
  heroLg: {
    fontFamily: fontFamilies.condensed75Bold,
    fontSize: 52,
    lineHeight: 48,
    fontVariant: tabular,
  },
  heroMd: {
    fontFamily: fontFamilies.condensed75ExtraBold,
    fontSize: 34,
    lineHeight: 36,
    fontVariant: tabular,
  },
  heroSm: {
    fontFamily: fontFamilies.condensed75Bold,
    fontSize: 32,
    lineHeight: 34,
    fontVariant: tabular,
  },
  /** Small stat: 20 / 700 / stretch 80% */
  stat: { fontFamily: fontFamilies.condensed80Bold, fontSize: 20, lineHeight: 24 },
  /** Profile name: 22 / 700 / stretch 85% (closest instance) */
  nameTitle: { fontFamily: fontFamilies.condensed80Bold, fontSize: 22, lineHeight: 26 },

  cardTitle: { fontFamily: fontFamilies.bold, fontSize: 18, lineHeight: 22 },
  cardTitleSm: { fontFamily: fontFamilies.semibold, fontSize: 16, lineHeight: 20 },
  subtitle: { fontFamily: fontFamilies.extrabold, fontSize: 17, lineHeight: 22 },

  body: { fontFamily: fontFamilies.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fontFamilies.medium, fontSize: 15, lineHeight: 21 },
  bodySemibold: { fontFamily: fontFamilies.semibold, fontSize: 15, lineHeight: 21 },
  bodyBold: { fontFamily: fontFamilies.bold, fontSize: 15, lineHeight: 21 },
  bodyLg: { fontFamily: fontFamilies.regular, fontSize: 16, lineHeight: 22 },

  secondary: { fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 18 },
  secondarySemibold: { fontFamily: fontFamilies.semibold, fontSize: 13, lineHeight: 18 },
  secondaryBold: { fontFamily: fontFamilies.bold, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: fontFamilies.regular, fontSize: 14, lineHeight: 19 },
  smallSemibold: { fontFamily: fontFamilies.semibold, fontSize: 14, lineHeight: 19 },
  smallBold: { fontFamily: fontFamilies.bold, fontSize: 14, lineHeight: 19 },

  caption: { fontFamily: fontFamilies.regular, fontSize: 12, lineHeight: 17 },
  captionSemibold: { fontFamily: fontFamilies.semibold, fontSize: 12, lineHeight: 17 },
  captionBold: { fontFamily: fontFamilies.bold, fontSize: 12, lineHeight: 17 },
  micro: { fontFamily: fontFamilies.regular, fontSize: 11, lineHeight: 15 },
  microBold: { fontFamily: fontFamilies.extrabold, fontSize: 10, lineHeight: 14 },
  tab: { fontFamily: fontFamilies.semibold, fontSize: 10.5, lineHeight: 14 },

  button: { fontFamily: fontFamilies.bold, fontSize: 16, lineHeight: 20 },
  buttonLg: { fontFamily: fontFamilies.extrabold, fontSize: 17, lineHeight: 22 },
  buttonSm: { fontFamily: fontFamilies.bold, fontSize: 14, lineHeight: 18 },
  buttonXs: { fontFamily: fontFamilies.bold, fontSize: 13, lineHeight: 17 },

  /** TRACTA wordmark: 800 / stretch 112% / uppercase */
  wordmark: {
    fontFamily: fontFamilies.expanded112ExtraBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0.5,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

import type { TextStyle } from 'react-native';

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/** Type ramp. Each variant is a complete, self-contained text style. */
export const typography = {
  displayLg: { fontSize: 34, lineHeight: 41, fontWeight: fontWeights.bold, letterSpacing: -0.4 },
  displaySm: { fontSize: 28, lineHeight: 34, fontWeight: fontWeights.bold, letterSpacing: -0.3 },
  headingLg: { fontSize: 22, lineHeight: 28, fontWeight: fontWeights.semibold },
  headingMd: { fontSize: 18, lineHeight: 24, fontWeight: fontWeights.semibold },
  headingSm: { fontSize: 16, lineHeight: 22, fontWeight: fontWeights.semibold },
  bodyLg: { fontSize: 17, lineHeight: 24, fontWeight: fontWeights.regular },
  bodyMd: { fontSize: 15, lineHeight: 22, fontWeight: fontWeights.regular },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: fontWeights.regular },
  label: { fontSize: 13, lineHeight: 18, fontWeight: fontWeights.medium, letterSpacing: 0.2 },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: fontWeights.regular, letterSpacing: 0.2 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Spacing scale from the handoff: 20px screen gutter, 12–14px between blocks, 16–18px inside cards. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  ml: 14,
  lg: 16,
  xl: 18,
  screen: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
} as const;

export type SpacingToken = keyof typeof spacing;

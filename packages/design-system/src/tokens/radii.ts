/** Radii from the handoff: card 22, sheet 28, large button 16–18, pill, chip 8–14. */
export const radii = {
  none: 0,
  xs: 8,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 18,
  pill: 20,
  card: 22,
  sheet: 28,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;

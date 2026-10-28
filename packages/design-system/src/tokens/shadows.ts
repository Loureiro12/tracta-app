import type { ViewStyle } from 'react-native';

/** Shadows from the handoff: floating bars/toasts, highlighted CTA, share card. */
export const shadows = {
  none: {},
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  toast: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cta: {
    shadowColor: '#1A1A17',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  share: {
    shadowColor: '#1A1A17',
    shadowOpacity: 0.22,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
} as const satisfies Record<string, ViewStyle>;

export type ShadowToken = keyof typeof shadows;

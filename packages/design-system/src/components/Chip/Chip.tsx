import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Pressable } from '../Pressable/Pressable';
import { Text } from '../Text/Text';

import type { MaybeTestable } from '../../testing/test-id';
import type { PressableProps, ViewStyle } from 'react-native';

export type ChipTone =
  'neutral' | 'brand' | 'ink' | 'run' | 'sleep' | 'social' | 'success' | 'warn' | 'danger';

export type ChipProps = MaybeTestable & {
  label: string;
  tone?: ChipTone;
  /** Filled with the tone color (selected state). */
  selected?: boolean;
  size?: 'sm' | 'md';
  onPress?: NonNullable<PressableProps['onPress']>;
};

/** Small rounded label (filters, tags, "PRO", "Conectado"). */
export function Chip({
  label,
  tone = 'neutral',
  selected = false,
  size = 'md',
  onPress,
  testID,
}: ChipProps) {
  const theme = useTheme();
  const { style, fg } = useMemo(() => {
    const c = theme.colors;
    const tones: Record<
      ChipTone,
      { bg: string; fg: keyof typeof c; selBg: string; selFg: keyof typeof c }
    > = {
      neutral: { bg: c.fill2, fg: 'text', selBg: c.ink, selFg: 'textOnInk' },
      brand: { bg: c.brandTint, fg: 'brandDark', selBg: c.brand, selFg: 'textOnBrand' },
      ink: { bg: c.ink, fg: 'textOnInk', selBg: c.ink, selFg: 'textOnInk' },
      run: { bg: c.runLight, fg: 'text', selBg: c.run, selFg: 'textOnBrand' },
      sleep: { bg: c.sleepLight, fg: 'sleep', selBg: c.sleep, selFg: 'textOnBrand' },
      social: { bg: c.socialBg, fg: 'social', selBg: c.social, selFg: 'textOnBrand' },
      success: { bg: c.successTint, fg: 'success', selBg: c.success, selFg: 'textOnBrand' },
      warn: { bg: c.warnBg, fg: 'warnText', selBg: c.warnText, selFg: 'textOnBrand' },
      danger: { bg: c.surface, fg: 'danger', selBg: c.danger, selFg: 'textOnBrand' },
    };
    const t = tones[tone];
    const s: ViewStyle = {
      backgroundColor: selected ? t.selBg : t.bg,
      borderRadius: size === 'sm' ? theme.radii.xs : theme.radii.sm,
      height: size === 'sm' ? 24 : 32,
      paddingHorizontal: size === 'sm' ? theme.spacing.sm : theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    };
    return { style: s, fg: selected ? t.selFg : t.fg };
  }, [theme, tone, selected, size]);

  const text = (
    <Text
      variant={size === 'sm' ? 'captionBold' : 'secondarySemibold'}
      color={fg}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
  if (onPress) {
    return (
      <Pressable
        testID={testID ?? 'ds.chip.pressable'}
        onPress={onPress}
        style={style}
        accessibilityLabel={label}
        accessibilityState={{ selected }}
      >
        {text}
      </Pressable>
    );
  }
  return (
    <Box testID={testID} style={style} accessible accessibilityLabel={label}>
      {text}
    </Box>
  );
}

import { useEffect, useMemo, useState } from 'react';

import { Animated } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';

export type DotProps = MaybeTestable & {
  color?: keyof SemanticColors;
  /** Diameter, default 8. */
  size?: number;
  /** Opacity pulse 1 → .35 every 1.4s, the handoff's "live" indicator. */
  pulse?: boolean;
};

/** Small colored circle used as a legend/status marker. */
export function Dot({ color = 'brand', size = 8, pulse = false, testID }: DotProps) {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, opacity]);

  const style = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.colors[color],
      opacity,
    }),
    [size, theme, color, opacity],
  );
  return <Animated.View testID={testID} style={style} />;
}

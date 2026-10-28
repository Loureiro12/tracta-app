import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { HStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { MaybeTestable } from '../../testing/test-id';

export type LogoProps = MaybeTestable & {
  /** Symbol side in px. Default 40. */
  size?: number;
  /** Render the TRACTA wordmark next to the symbol. */
  wordmark?: boolean;
};

/**
 * Tracta symbol (option 2a): ink rounded square with three rising bars aligned to the base.
 * Proportions from the handoff: 150 box, radius 34, bars 22 wide, gap 10, heights 34/54/76, bottom padding 38.
 */
export function Logo({ size = 40, wordmark = false, testID }: LogoProps) {
  const theme = useTheme();
  const barsWidth = 22 * 3 + 10 * 2;
  const x0 = (150 - barsWidth) / 2;
  const heights = [34, 54, 76];
  const colors = [theme.colors.bg, theme.colors.bg, theme.colors.brand];
  return (
    <HStack testID={testID} gap="md">
      <Svg width={size} height={size} viewBox="0 0 150 150">
        <Rect x={0} y={0} width={150} height={150} rx={34} fill={theme.colors.ink} />
        {heights.map((h, i) => (
          <Rect
            key={i}
            x={x0 + i * 32}
            y={150 - 38 - h}
            width={22}
            height={h}
            rx={4}
            fill={colors[i] ?? theme.colors.bg}
          />
        ))}
      </Svg>
      {wordmark ? (
        <Text testID={testID ? `${testID}.wordmark` : undefined} variant="wordmark" uppercase>
          Tracta
        </Text>
      ) : null}
    </HStack>
  );
}

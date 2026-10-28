import { useMemo } from 'react';

import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { Box, fontFamilies } from '@tracta/design-system';

import { initials } from '../model/social.ranking';

type Props = {
  name: string;
  /** Hue from the friend data; the background is the same hue at 12% (prototype `avOf`). */
  color: string;
  /** Diameter: 36 in lists, 44 in the empty state. */
  size?: 36 | 44;
  testID?: string;
};

/**
 * Letter avatar tinted with the friend's own color. The hue is data (not a theme token), so the
 * glyph is drawn with SVG instead of the token-only Text primitive.
 */
export function FriendAvatar({ name, color, size = 36, testID }: Props) {
  const fontSize = size === 44 ? 16 : 14;
  const style = useMemo(() => ({ width: size, height: size }), [size]);
  return (
    <Box testID={testID} style={style} accessibilityLabel={name}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} fillOpacity={0.12} />
        <SvgText
          x={size / 2}
          y={size / 2 + fontSize * 0.36}
          fill={color}
          fontFamily={fontFamilies.bold}
          fontSize={fontSize}
          textAnchor="middle"
        >
          {initials(name)}
        </SvgText>
      </Svg>
    </Box>
  );
}

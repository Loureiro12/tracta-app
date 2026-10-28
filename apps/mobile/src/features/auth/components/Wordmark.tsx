import Svg, { Text as SvgText } from 'react-native-svg';

import { Box, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

type Props = { testID: string };

const WIDTH = 340;
const HEIGHT = 60;
const FONT_SIZE = 64;

/**
 * 64px TRACTA wordmark (Archivo ExtraBold, width 112%). The design-system `Logo` only renders the
 * 24px wordmark, so the hero version is drawn as SVG text in the same brand font.
 */
export function Wordmark({ testID }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const label = t('welcome.wordmark');
  return (
    <Box testID={testID} accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={WIDTH} height={HEIGHT}>
        <SvgText
          x={0}
          y={HEIGHT - 4}
          fontFamily={theme.typography.wordmark.fontFamily}
          fontSize={FONT_SIZE}
          letterSpacing={0.6}
          fill={theme.colors.text}
        >
          {label}
        </SvgText>
      </Svg>
    </Box>
  );
}

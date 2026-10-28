import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Box, HStack, Text, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { CardLogo } from './CardLogo';
import { cardSizes } from '../model/share.mock';
import { shareIds } from '../share.testids';

import type { CardContent } from '../hooks/useShareCardContent';
import type { ShareFormat, ShareStyle } from '../model/share.mock';
import type { SemanticColors } from '@tracta/design-system';
import type { ViewStyle } from 'react-native';

type ColorToken = keyof SemanticColors;

/** Prototype `STY`: card palettes per style, mapped to theme tokens (opacities for the muted bars/lines). */
type Palette = {
  bg: ColorToken;
  fg: ColorToken;
  sub: ColorToken;
  acc: ColorToken;
  bar: ColorToken;
  off: ColorToken;
  offOpacity: number;
  logoBg: ColorToken;
  logoFg: ColorToken;
  lineOpacity: number;
};

const palettes: Record<ShareStyle, Palette> = {
  ink: {
    bg: 'ink',
    fg: 'textOnInk',
    sub: 'text2OnInk',
    acc: 'brandOnDark',
    bar: 'brand',
    off: 'textOnInk',
    offOpacity: 0.18,
    logoBg: 'bg',
    logoFg: 'ink',
    lineOpacity: 0.22,
  },
  sand: {
    bg: 'bg',
    fg: 'text',
    sub: 'text2',
    acc: 'brandText',
    bar: 'brand',
    off: 'text',
    offOpacity: 0.12,
    logoBg: 'ink',
    logoFg: 'bg',
    lineOpacity: 0.12,
  },
  brand: {
    bg: 'brand',
    fg: 'textOnBrand',
    sub: 'text2OnInk',
    acc: 'ink',
    bar: 'ink',
    off: 'textOnBrand',
    offOpacity: 0.3,
    logoBg: 'ink',
    logoFg: 'bg',
    lineOpacity: 0.22,
  },
  photo: {
    bg: 'text3',
    fg: 'textOnInk',
    sub: 'text2OnInk',
    acc: 'brandOnDark',
    bar: 'brand',
    off: 'textOnInk',
    offOpacity: 0.25,
    logoBg: 'bg',
    logoFg: 'ink',
    lineOpacity: 0.22,
  },
};

export type ShareCardProps = {
  content: CardContent;
  style: ShareStyle;
  format: ShareFormat;
  /** "Meu nome" option. */
  showName: boolean;
  handle: string;
};

/** Card preview (Story 232×412 / Post 270×338) with the `share` shadow. Never shows health data. */
export function ShareCard({ content, style, format, showName, handle }: ShareCardProps) {
  const theme = useTheme();
  const { t } = useTranslation(['share', 'common']);
  const p = palettes[style];
  const size = cardSizes[format];

  const sizeStyle = useMemo<ViewStyle>(() => ({ width: size.width, height: size.height }), [size]);
  const offBarStyle = useMemo<ViewStyle>(() => ({ opacity: p.offOpacity }), [p]);
  const lineStyle = useMemo<ViewStyle>(
    () => ({ height: 1, opacity: p.lineOpacity, alignSelf: 'stretch' }),
    [p],
  );
  const gradientColors = useMemo(() => ['transparent', theme.colors.ink] as const, [theme]);

  return (
    <Box testID={shareIds.card} shadow="share" radius="xl" bg={p.bg} style={sizeStyle}>
      <Box flex={1} radius="xl" style={styles.clip}>
        {style === 'photo' ? (
          <>
            <Box
              testID={shareIds.cardPhoto}
              bg="text3"
              align="center"
              justify="center"
              style={StyleSheet.absoluteFill}
            >
              <Text variant="captionSemibold" color="textOnInk">
                {t('share:card.photoPlaceholder')}
              </Text>
            </Box>
            <LinearGradient colors={gradientColors} style={styles.gradient} pointerEvents="none" />
          </>
        ) : null}

        <Box style={styles.content} pointerEvents="none">
          <HStack justify="space-between">
            <HStack gap="xs">
              <CardLogo bg={p.logoBg} fg={p.logoFg} />
              <Text variant="captionBold" color={p.fg} uppercase>
                {t('common:appName')}
              </Text>
            </HStack>
            <Text testID={shareIds.cardDate} variant="micro" color={p.sub}>
              {t('share:card.date')}
            </Text>
          </HStack>

          <Box flex={1} />

          <Text testID={shareIds.cardKicker} variant="secondaryBold" color={p.acc}>
            {content.kicker}
          </Text>
          <Text
            testID={shareIds.cardBig}
            variant={content.big.length <= 4 ? 'heroXl' : 'heroLg'}
            color={p.fg}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {content.big}
          </Text>
          <Text testID={shareIds.cardLine} variant="bodySemibold" color={p.fg}>
            {content.line}
          </Text>

          {content.bars ? (
            <Box testID={shareIds.cardBars} style={styles.bars}>
              {content.bars.map((bar, i) => (
                <Box key={i} flex={1} align="center" gap="xxs">
                  <Box
                    bg={bar.active ? p.bar : p.off}
                    style={[styles.bar, { height: bar.height }, bar.active ? null : offBarStyle]}
                  />
                  <Text variant="micro" color={p.sub}>
                    {bar.label}
                  </Text>
                </Box>
              ))}
            </Box>
          ) : null}

          {content.dots ? (
            <Box testID={shareIds.cardDots} style={styles.dots}>
              {content.dots.map((dot, i) => (
                <Box key={i} flex={1} align="center" gap="xxs">
                  <Box
                    {...(dot.active ? { bg: p.bar } : {})}
                    borderColor={dot.active ? p.bar : p.off}
                    borderWidth={1.5}
                    radius="full"
                    style={[styles.dot, dot.active ? null : offBarStyle]}
                  />
                  <Text variant="micro" color={p.sub}>
                    {dot.label}
                  </Text>
                </Box>
              ))}
            </Box>
          ) : null}

          <Box style={styles.rows}>
            <Box bg={p.fg} style={lineStyle} />
            {content.rows.map((row) => (
              <HStack
                key={row.key}
                testID={`${shareIds.card}.row.${row.key}`}
                justify="space-between"
                gap="sm"
              >
                <Text variant="caption" color={p.sub}>
                  {row.label}
                </Text>
                <Text variant="captionBold" color={p.fg} numberOfLines={1}>
                  {row.value}
                </Text>
              </HStack>
            ))}
          </Box>

          {showName ? (
            <Text testID={shareIds.cardHandle} variant="micro" color={p.sub}>
              {handle}
            </Text>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', opacity: 0.82 },
  content: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 18, gap: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 56, paddingTop: 6 },
  bar: { alignSelf: 'stretch', borderRadius: 4 },
  dots: { flexDirection: 'row', gap: 4, paddingTop: 6 },
  dot: { width: 24, height: 24 },
  rows: { gap: 5, paddingTop: 8 },
});

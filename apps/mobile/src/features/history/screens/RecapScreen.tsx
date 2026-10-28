import { useMemo, useState } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Button, HStack, Pressable, Text, VStack, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { historyIds as ids } from '../history.testids';
import { useBackToHistory } from '../hooks/useBackToHistory';
import { historyHrefs } from '../lib/routes';
import { recapSlides } from '../model/history.mock';

import type { RecapSlideIndex } from '../model/history.mock';
import type { SemanticColors } from '@tracta/design-system';
import type { ViewStyle } from 'react-native';

const ROW_INDEXES = [0, 1, 2] as const;

/** Monthly recap as 5 full-screen stories: tap advances, "Anterior" goes back, last tap closes. */
export function RecapScreen() {
  const { t } = useTranslation('history');
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = useBackToHistory();
  const [index, setIndex] = useState<RecapSlideIndex>(0);
  const slide = recapSlides[index] ?? recapSlides[0]!;
  const fg: keyof SemanticColors = slide.light ? 'textOnBrand' : 'text';

  const frameStyle = useMemo<ViewStyle>(
    () => ({
      paddingTop: insets.top + theme.spacing.ml,
      paddingBottom: Math.max(insets.bottom, theme.spacing['3xl']) + theme.spacing.sm,
    }),
    [insets.top, insets.bottom, theme],
  );
  const prevStyle = useMemo<ViewStyle>(
    () => ({
      flex: 1,
      height: 56,
      borderRadius: theme.radii.lg,
      borderWidth: 1.5,
      borderColor: theme.colors[fg],
      alignItems: 'center',
      justifyContent: 'center',
      opacity: index === 0 ? 0.5 : 1,
    }),
    [theme, fg, index],
  );

  const next = () => {
    if (index >= recapSlides.length - 1) goBack();
    else setIndex((index + 1) as RecapSlideIndex);
  };
  const prev = () => setIndex(Math.max(0, index - 1) as RecapSlideIndex);

  return (
    <Box testID={ids.recapScreen} flex={1} bg={slide.bg} px="screen" gap="xl" style={frameStyle}>
      <HStack testID={ids.recapProgress} gap="xs">
        {recapSlides.map((s) => (
          <Box
            key={s.index}
            testID={`${ids.recapProgress}.${s.index}`}
            flex={1}
            bg={fg}
            style={[styles.bar, s.index > index ? styles.dim : null]}
          />
        ))}
      </HStack>
      <HStack justify="space-between">
        <Text variant="secondaryBold" color={fg} numberOfLines={1}>
          {t('recap.brand')}
        </Text>
        <Pressable
          testID={ids.recapClose}
          onPress={goBack}
          accessibilityLabel={t('recap.close')}
          style={styles.close}
        >
          <Text variant="bodyBold" color={fg}>
            {t('recap.close')}
          </Text>
        </Pressable>
      </HStack>
      <Pressable
        testID={ids.recapNext}
        onPress={next}
        accessibilityLabel={t(`recap.slides.${index}.kicker`)}
        pressedOpacity={1}
        style={styles.body}
      >
        <Text testID={ids.recapKicker} variant="bodySemibold" color={fg}>
          {t(`recap.slides.${index}.kicker`)}
        </Text>
        <Text testID={ids.recapBig} variant="heroXl" color={fg} numberOfLines={1}>
          {slide.big}
        </Text>
        <Text testID={ids.recapTitle} variant="nameTitle" color={fg}>
          {t(`recap.slides.${index}.title`)}
        </Text>
        <VStack gap="sm" pt="xs">
          {ROW_INDEXES.map((r) => (
            <VStack key={r} gap="sm">
              <HStack justify="space-between" gap="md">
                <Text variant="bodyLg" color={fg}>
                  {t(`recap.slides.${index}.rows.${r}.label`)}
                </Text>
                <Text variant="bodyBold" color={fg} numberOfLines={1}>
                  {t(`recap.slides.${index}.rows.${r}.value`)}
                </Text>
              </HStack>
              <Box bg={fg} style={[styles.line, styles.lineDim]} />
            </VStack>
          ))}
        </VStack>
      </Pressable>
      <HStack gap="sm" align="stretch">
        <Pressable
          testID={ids.recapPrev}
          onPress={prev}
          disabled={index === 0}
          accessibilityLabel={t('recap.prev')}
          style={prevStyle}
        >
          <Text variant="bodyBold" color={fg}>
            {t('recap.prev')}
          </Text>
        </Pressable>
        <Box flex={1}>
          <Button
            testID={ids.recapShare}
            label={t('recap.share')}
            variant={slide.light ? 'onInk' : 'primary'}
            size="lg"
            fullWidth
            onPress={() => router.push(historyHrefs.share('month'))}
          />
        </Box>
      </HStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  bar: { height: 3, borderRadius: 2 },
  dim: { opacity: 0.3 },
  close: { height: 40, paddingHorizontal: 4, justifyContent: 'center' },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  line: { height: 1 },
  lineDim: { opacity: 0.35 },
});

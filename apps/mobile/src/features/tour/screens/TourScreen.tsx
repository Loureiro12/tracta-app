import { useMemo, useState } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';

import { Box, Button, HStack, TabBar, Text, useTheme, VStack } from '@tracta/design-system';

import { useAuthStore } from '@/features/auth';
import { useTranslation } from '@/shared/i18n';

import { SPOT_STEPS, TOUR_STEPS, TOUR_TABS, WELCOME_ITEMS, WELCOME_STEP } from '../model/tour.mock';
import { tourIds } from '../tour.testids';

import type { TabBarItem } from '@tracta/design-system';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';

/** Geometry of the design-system TabBar (6 top + 52 item + bottom inset) and the prototype spotlight. */
const TAB_BAR_TOP = 6;
const TAB_ITEM_HEIGHT = 52;
const TAB_BAR_SIDE = 6;
const TAB_BAR_MIN_BOTTOM = 12;
const HOLE_WIDTH = 64;
const HOLE_HEIGHT = 60;
const HOLE_RADIUS = 18;
const HOLE_RING = 2.5;
const CARD_SIDE = 16;
const CARD_ABOVE_TABS = 18;
const ARROW_SIZE = 14;
const TOTAL_SPOTS = SPOT_STEPS.length;

const noop = () => undefined;

/**
 * First-run tour: welcome modal → six spotlights over the tab bar → "all set" modal.
 * Rendered as a full-screen overlay on a sand background with a static tab bar underneath.
 */
export function TourScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(['tour', 'common']);
  const firstName = useAuthStore((s) => s.account?.name.split(' ')[0] ?? '');

  const [index, setIndex] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const step = TOUR_STEPS[index] ?? WELCOME_STEP;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const next = () => {
    if (index + 1 < TOUR_STEPS.length) setIndex(index + 1);
    else close();
  };
  const back = () => setIndex(Math.max(1, index - 1));
  const primary = () => {
    if (step.kind === 'welcome') setIndex(1);
    else close();
  };
  const secondary = () => {
    if (step.kind === 'done') router.replace('/social');
    else close();
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const activeTab = step.kind === 'spot' ? step.tab : 'home';
  const tabs: TabBarItem[] = TOUR_TABS.map((tab) => ({
    key: tab.key,
    label: t(`common:tabs.${tab.key}`),
    icon: tab.icon,
    active: tab.key === activeTab,
    testID: `${tourIds.tab}.${tab.key}`,
    onPress: noop,
  }));

  const tabBarHeight = TAB_BAR_TOP + TAB_ITEM_HEIGHT + Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM);
  const tabIndex = TOUR_TABS.findIndex((tab) => tab.key === activeTab);
  const tabWidth = (size.width - TAB_BAR_SIDE * 2) / TOUR_TABS.length;
  const hole = {
    x: TAB_BAR_SIDE + tabIndex * tabWidth + (tabWidth - HOLE_WIDTH) / 2,
    y: size.height - tabBarHeight + 2,
  };

  const cardStyle = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      left: CARD_SIDE,
      right: CARD_SIDE,
      bottom: tabBarHeight + CARD_ABOVE_TABS,
    }),
    [tabBarHeight],
  );
  const arrowStyle = useMemo<ViewStyle>(
    () => ({ left: hole.x + HOLE_WIDTH / 2 - CARD_SIDE - ARROW_SIZE / 2 }),
    [hole.x],
  );

  const spotIndex = step.kind === 'spot' ? index : 0; // 1..6
  const spot = step.kind === 'spot' ? step : null;

  return (
    <Box testID={tourIds.screen} flex={1} bg="bg" onLayout={onLayout}>
      <TabBar testID={tourIds.tab} items={tabs} />

      {spot && size.width > 0 ? (
        <>
          <Svg
            width={size.width}
            height={size.height}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Defs>
              {/* Mask luminance: white keeps the dim layer, black punches the spotlight hole. */}
              <Mask id="tour-hole">
                <Rect x={0} y={0} width={size.width} height={size.height} fill="white" />
                <Rect
                  x={hole.x}
                  y={hole.y}
                  width={HOLE_WIDTH}
                  height={HOLE_HEIGHT}
                  rx={HOLE_RADIUS}
                  fill="black"
                />
              </Mask>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              fill={theme.colors.overlay}
              mask="url(#tour-hole)"
            />
            <Rect
              x={hole.x}
              y={hole.y}
              width={HOLE_WIDTH}
              height={HOLE_HEIGHT}
              rx={HOLE_RADIUS}
              fill="none"
              stroke={theme.colors.surface}
              strokeWidth={HOLE_RING}
            />
          </Svg>
          <Box
            testID={tourIds.spot}
            bg="surface"
            radius="card"
            shadow="floating"
            pt="xl"
            px="xl"
            pb="ml"
            gap="sm"
            style={cardStyle}
          >
            <HStack justify="space-between">
              <Text testID={tourIds.spotStep} variant="captionBold" color="brandText" uppercase>
                {t('tour:spot.step', { n: spotIndex, total: TOTAL_SPOTS })}
              </Text>
              <Button
                testID={tourIds.spotSkip}
                label={t('tour:spot.skip')}
                variant="ghost"
                size="xs"
                onPress={close}
              />
            </HStack>
            <Text testID={tourIds.spotTitle} variant="nameTitle">
              {t(`tour:steps.${spot.key}.title`)}
            </Text>
            <Text testID={tourIds.spotBody} variant="small">
              {t(`tour:steps.${spot.key}.body`)}
            </Text>
            <HStack gap="sm" pt="xs">
              <HStack flex={1} gap="xs">
                {SPOT_STEPS.map((s, i) => (
                  <Box
                    key={s.key}
                    bg={i + 1 <= spotIndex ? 'ink' : 'switchOff'}
                    style={i + 1 === spotIndex ? styles.dotActive : styles.dot}
                  />
                ))}
              </HStack>
              {spotIndex > 1 ? (
                <Button
                  testID={tourIds.spotBack}
                  label={t('tour:spot.back')}
                  variant="ghost"
                  size="sm"
                  onPress={back}
                />
              ) : null}
              <Button
                testID={tourIds.spotNext}
                label={spotIndex === TOTAL_SPOTS ? t('tour:spot.finish') : t('tour:spot.next')}
                size="sm"
                onPress={next}
              />
            </HStack>
            <Box bg="surface" style={[styles.arrow, arrowStyle]} />
          </Box>
        </>
      ) : null}

      {step.kind === 'welcome' || step.kind === 'done' ? (
        <Box
          testID={tourIds.modal}
          bg="overlay"
          align="center"
          justify="center"
          p="2xl"
          style={StyleSheet.absoluteFill}
        >
          <Box bg="surface" radius="sheet" p="2xl" gap="ml" style={styles.modalCard}>
            <Text variant="captionBold" color="brandText" uppercase>
              {t(`tour:${step.kind}.eyebrow`)}
            </Text>
            <Text testID={tourIds.modalTitle} variant="heroMd" accessibilityRole="header">
              {step.kind === 'welcome' && firstName
                ? t('tour:welcome.titleNamed', { name: firstName })
                : t(`tour:${step.kind}.title`)}
            </Text>
            <Text color="text2">{t(`tour:${step.kind}.body`)}</Text>
            {step.kind === 'welcome' ? (
              <VStack gap="sm" py="xs">
                {WELCOME_ITEMS.map((n) => (
                  <HStack key={n} gap="sm">
                    <Box
                      bg="brandTint"
                      radius="full"
                      align="center"
                      justify="center"
                      style={styles.number}
                    >
                      <Text variant="captionBold" color="brandText">
                        {String(n)}
                      </Text>
                    </Box>
                    <Text variant="smallSemibold">{t(`tour:welcome.items.item${n}`)}</Text>
                  </HStack>
                ))}
              </VStack>
            ) : null}
            <Button
              testID={tourIds.modalPrimary}
              label={t(`tour:${step.kind}.cta`)}
              size="lg"
              fullWidth
              onPress={primary}
            />
            <Button
              testID={tourIds.modalSecondary}
              label={t(`tour:${step.kind}.cta2`)}
              variant="ghost"
              size="sm"
              fullWidth
              onPress={secondary}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

const styles = StyleSheet.create({
  modalCard: { alignSelf: 'stretch' },
  number: { width: 22, height: 22 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18, height: 6, borderRadius: 3 },
  arrow: {
    position: 'absolute',
    bottom: -ARROW_SIZE / 2,
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    transform: [{ rotate: '45deg' }],
  },
});

import { StyleSheet } from 'react-native';

import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { Box, Text, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { historyIds as ids } from '../history.testids';

import type { RouteGeometry } from '../model/history.types';

const VIEW_W = 358;
const VIEW_H = 230;

/** Illustrative GPS route on a grid (the real app renders MapKit / Google Maps here). */
export function RouteMap({ route }: { route: RouteGeometry }) {
  const { t } = useTranslation('history');
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Box testID={ids.sessionMap} bg="fill2" radius="card" style={styles.map}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Defs>
          <Pattern id="grid" width={28} height={28} patternUnits="userSpaceOnUse">
            <Path d="M 28 0 L 0 0 0 28" fill="none" stroke={c.divider} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />
        <Path
          d={route.full}
          fill="none"
          stroke={c.dividerStrong}
          strokeWidth={3}
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
        <Path
          d={route.partial}
          fill="none"
          stroke={c.brandText}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={route.cx} cy={route.cy} r={11} fill={c.success} fillOpacity={0.18} />
        <Circle
          cx={route.cx}
          cy={route.cy}
          r={5.5}
          fill={c.brand}
          stroke={c.surface}
          strokeWidth={2.5}
        />
      </Svg>
      <Box bg="surface" radius="xs" style={styles.label}>
        <Text variant="captionSemibold" color="text2" numberOfLines={1}>
          {t('detail.mapLabel')}
        </Text>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  map: { height: VIEW_H, overflow: 'hidden' },
  label: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    opacity: 0.9,
  },
});

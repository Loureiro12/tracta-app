import { useMemo } from 'react';

import { Platform, StyleSheet } from 'react-native';

import Constants from 'expo-constants';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Box, Text, useTheme } from '@tracta/design-system';

import { env } from '@/shared/config/env';

import { ROUTE_GRID, ROUTE_HEIGHT, ROUTE_WIDTH } from '../model/run.mock';

import type { ViewStyle } from 'react-native';
import type { Region } from 'react-native-maps';

/** [latitude, longitude] in degrees. */
export type RunMapPoint = readonly [number, number];

export type RunMapProps = {
  /** Recorded track, oldest first. */
  route: readonly RunMapPoint[];
  /** Live activity: follows the track and marks the current position. */
  live?: boolean;
  caption: string;
  /** When set, replaces the route with a centered title/subtitle (no-GPS activities). */
  placeholder?: { title: string; subtitle: string; testID: string };
  testID: string;
};

/**
 * Real map tiles: Apple Maps on iOS, Google Maps on Android when GOOGLE_MAPS_API_KEY was set at
 * build time. E2E builds always draw the route instead (tiles are not deterministic).
 */
const NATIVE_MAP =
  !env.isE2E &&
  (Platform.OS === 'ios' ||
    (Platform.OS === 'android' &&
      Boolean(Constants.expoConfig?.android?.config?.googleMaps?.apiKey)));

const PAD = 24;
const MIN_DELTA = 0.004;

const GRID_X = Array.from(
  { length: Math.ceil(ROUTE_WIDTH / ROUTE_GRID) },
  (_, i) => i * ROUTE_GRID,
);
const GRID_Y = Array.from(
  { length: Math.ceil(ROUTE_HEIGHT / ROUTE_GRID) },
  (_, i) => i * ROUTE_GRID,
);

function boundsOf(route: readonly RunMapPoint[]) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lat, lng] of route) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  return { minLat, maxLat, minLng, maxLng };
}

function regionOf(route: readonly RunMapPoint[]): Region {
  const b = boundsOf(route);
  return {
    latitude: (b.minLat + b.maxLat) / 2,
    longitude: (b.minLng + b.maxLng) / 2,
    latitudeDelta: Math.max(MIN_DELTA, (b.maxLat - b.minLat) * 1.4),
    longitudeDelta: Math.max(MIN_DELTA, (b.maxLng - b.minLng) * 1.4),
  };
}

/** Fits the track into the SVG canvas (equirectangular, aspect ratio kept, centered). */
function projectRoute(route: readonly RunMapPoint[]): [number, number][] {
  if (route.length === 0) return [];
  const b = boundsOf(route);
  const k = Math.cos((((b.minLat + b.maxLat) / 2) * Math.PI) / 180);
  const w = Math.max(1e-9, (b.maxLng - b.minLng) * k);
  const h = Math.max(1e-9, b.maxLat - b.minLat);
  const scale = Math.min((ROUTE_WIDTH - PAD * 2) / w, (ROUTE_HEIGHT - PAD * 2) / h);
  const ox = (ROUTE_WIDTH - w * scale) / 2;
  const oy = (ROUTE_HEIGHT - h * scale) / 2;
  return route.map(([lat, lng]) => [
    ox + (lng - b.minLng) * k * scale,
    oy + (b.maxLat - lat) * scale,
  ]);
}

function toPath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

/** GPS route on a real map (or drawn on a grid where no map is available), start and end marked. */
export function RunMap({ route, live = false, caption, placeholder, testID }: RunMapProps) {
  const theme = useTheme();
  const c = theme.colors;
  const frame = useMemo<ViewStyle>(
    () => ({ height: ROUTE_HEIGHT, borderRadius: theme.radii.card, overflow: 'hidden' }),
    [theme],
  );
  const dots = useMemo<{ start: ViewStyle; end: ViewStyle }>(
    () => ({
      start: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: c.success,
        borderWidth: 2.5,
        borderColor: c.surface,
      },
      end: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: c.brand,
        borderWidth: 2.5,
        borderColor: c.surface,
      },
    }),
    [c],
  );

  const showRoute = !placeholder && route.length > 0;
  const native = NATIVE_MAP && showRoute;
  const region = useMemo(() => (native ? regionOf(route) : null), [native, route]);
  const projected = useMemo(
    () => (showRoute && !native ? projectRoute(route) : []),
    [showRoute, native, route],
  );
  const coords = useMemo(
    () => (native ? route.map(([latitude, longitude]) => ({ latitude, longitude })) : []),
    [native, route],
  );
  const first = projected[0];
  const last = projected[projected.length - 1];

  return (
    <Box testID={testID} bg="fill3" style={frame}>
      {native && region ? (
        <MapView
          style={StyleSheet.absoluteFill}
          {...(Platform.OS === 'android' ? { provider: PROVIDER_GOOGLE } : {})}
          {...(live ? { region } : { initialRegion: region })}
          liteMode={!live}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          showsCompass={false}
          showsPointsOfInterests={false}
        >
          <Polyline
            coordinates={coords}
            strokeColor={c.brandText}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
          {coords[0] ? (
            <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <Box style={dots.start} />
            </Marker>
          ) : null}
          {coords.length > 1 ? (
            <Marker
              coordinate={coords[coords.length - 1]!}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <Box style={dots.end} />
            </Marker>
          ) : null}
        </MapView>
      ) : (
        <Svg viewBox={`0 0 ${ROUTE_WIDTH} ${ROUTE_HEIGHT}`} width="100%" height="100%">
          {GRID_X.map((x) => (
            <Line
              key={`x${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={ROUTE_HEIGHT}
              stroke={c.divider}
              strokeWidth={1}
            />
          ))}
          {GRID_Y.map((y) => (
            <Line
              key={`y${y}`}
              x1={0}
              y1={y}
              x2={ROUTE_WIDTH}
              y2={y}
              stroke={c.divider}
              strokeWidth={1}
            />
          ))}
          {projected.length > 1 ? (
            <Path
              d={toPath(projected)}
              fill="none"
              stroke={c.brandText}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {first && projected.length > 1 ? (
            <Circle
              cx={first[0]}
              cy={first[1]}
              r={5}
              fill={c.success}
              stroke={c.surface}
              strokeWidth={2}
            />
          ) : null}
          {last ? (
            <>
              {live ? (
                <Circle cx={last[0]} cy={last[1]} r={11} fill={c.success} fillOpacity={0.18} />
              ) : null}
              <Circle
                cx={last[0]}
                cy={last[1]}
                r={5.5}
                fill={c.brand}
                stroke={c.surface}
                strokeWidth={2.5}
              />
            </>
          ) : null}
        </Svg>
      )}
      {placeholder ? (
        <Box style={StyleSheet.absoluteFill} align="center" justify="center" gap="xs" p="screen">
          <Text testID={placeholder.testID} variant="cardTitleSm" align="center">
            {placeholder.title}
          </Text>
          <Text variant="secondary" color="text2" align="center">
            {placeholder.subtitle}
          </Text>
        </Box>
      ) : (
        <Box bg="surface" radius="xs" px="sm" py="xs" style={styles.caption}>
          <Text variant="captionSemibold" color="text2" numberOfLines={1}>
            {caption}
          </Text>
        </Box>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  caption: { position: 'absolute', left: 12, bottom: 12 },
});

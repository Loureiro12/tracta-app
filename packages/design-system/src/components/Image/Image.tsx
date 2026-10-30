import { useMemo, useState } from 'react';

import { Image as RNImage, StyleSheet } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Icon } from '../Icon/Icon';
import { Text } from '../Text/Text';

import type { MaybeTestable } from '../../testing/test-id';
import type { RadiusToken } from '../../tokens/radii';
import type { ViewStyle } from 'react-native';

export type ImageProps = MaybeTestable & {
  /** Remote (https), file or data URI. `null` (or a load error) shows the placeholder frame. */
  uri: string | null | undefined;
  /** Frame height; the width follows the parent. */
  height: number;
  radius?: RadiusToken;
  /** Caption drawn inside the frame (over the photo, or under the placeholder icon). */
  caption?: string;
  accessibilityLabel?: string;
};

/**
 * Photo in a rounded fill-1 frame, cropped to cover. While there is no picture (no URI, still
 * loading or failed) the frame shows a camera icon, like the handoff's photo placeholders.
 * Derived ids: `<testID>.image` (the picture) and `<testID>.caption`.
 */
export function Image({
  uri,
  height,
  radius = 'md',
  caption,
  accessibilityLabel,
  testID,
}: ImageProps) {
  const theme = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = !!uri && failedUri !== uri;
  const frame = useMemo<ViewStyle>(
    () => ({
      height,
      borderRadius: theme.radii[radius],
      backgroundColor: theme.colors.fill1,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    }),
    [theme, height, radius],
  );
  const captionOver = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      bottom: theme.spacing.sm,
      left: theme.spacing.sm,
      right: theme.spacing.sm,
    }),
    [theme],
  );
  return (
    <Box testID={testID} style={frame} accessibilityLabel={accessibilityLabel}>
      <Icon name="camera" size={height > 160 ? 28 : 20} color="text3" />
      {showImage ? (
        <RNImage
          testID={testID ? `${testID}.image` : undefined}
          source={{ uri }}
          resizeMode="cover"
          style={styles.fill}
          onError={() => setFailedUri(uri)}
        />
      ) : null}
      {caption && showImage ? (
        <Box style={captionOver} bg="ink" radius="xs" px="sm" py="xxs">
          <Text
            testID={testID ? `${testID}.caption` : undefined}
            variant="caption"
            color="textOnInk"
            align="center"
          >
            {caption}
          </Text>
        </Box>
      ) : null}
      {caption && !showImage ? (
        <Text
          testID={testID ? `${testID}.caption` : undefined}
          variant="caption"
          color="text2"
          align="center"
        >
          {caption}
        </Text>
      ) : null}
    </Box>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});

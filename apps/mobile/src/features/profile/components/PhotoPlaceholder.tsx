import { useMemo } from 'react';

import { Box, Icon, Text, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

type PhotoPlaceholderProps = {
  testID?: string;
  height: 140 | 250;
  /** Caption rendered inside the frame (compare view). */
  caption?: string;
};

/** Fill-1 rounded frame standing in for a progress photo (photos are placeholders in the handoff). */
export function PhotoPlaceholder({ testID, height, caption }: PhotoPlaceholderProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      height,
      borderRadius: height > 140 ? theme.radii.xl : theme.radii.md,
      backgroundColor: theme.colors.fill1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      overflow: 'hidden',
    }),
    [theme, height],
  );
  return (
    <Box testID={testID} style={style}>
      <Icon name="camera" size={height > 140 ? 28 : 20} color="text3" />
      {caption ? (
        <Text variant="caption" color="text2" align="center">
          {caption}
        </Text>
      ) : null}
    </Box>
  );
}

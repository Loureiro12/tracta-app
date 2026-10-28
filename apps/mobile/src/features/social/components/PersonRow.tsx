import { useMemo } from 'react';

import { Box, Text, useTheme } from '@tracta/design-system';

import { FriendAvatar } from './FriendAvatar';

import type { SemanticColors } from '@tracta/design-system';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type Props = {
  name: string;
  color: string;
  /** Custom title node (feed line); defaults to the name. */
  title?: ReactNode;
  titleVariant?: 'bodySemibold' | 'bodyBold';
  subtitle?: string;
  subtitleColor?: keyof SemanticColors;
  leading?: ReactNode;
  trailing?: ReactNode;
  minHeight?: 60 | 62 | 64 | 66;
  last?: boolean;
  testID?: string;
};

/** Avatar + name/status row with a hairline, used by every people list of the feature. */
export function PersonRow({
  name,
  color,
  title,
  titleVariant = 'bodySemibold',
  subtitle,
  subtitleColor = 'text2',
  leading,
  trailing,
  minHeight = 66,
  last = false,
  testID,
}: Props) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      minHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: theme.colors.divider,
    }),
    [theme, minHeight, last],
  );
  return (
    <Box testID={testID} style={style}>
      {leading}
      <FriendAvatar name={name} color={color} />
      <Box flex={1} gap="xxs">
        {title ?? (
          <Text testID={testID ? `${testID}.name` : undefined} variant={titleVariant}>
            {name}
          </Text>
        )}
        {subtitle ? (
          <Text
            testID={testID ? `${testID}.status` : undefined}
            variant="caption"
            color={subtitleColor}
          >
            {subtitle}
          </Text>
        ) : null}
      </Box>
      {trailing}
    </Box>
  );
}

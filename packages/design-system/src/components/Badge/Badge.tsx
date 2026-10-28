import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Text } from '../Text/Text';

import type { MaybeTestable } from '../../testing/test-id';

export type BadgeProps = MaybeTestable & {
  count: number;
};

/** Red unread counter (16px pill with a 2px sand ring). */
export function Badge({ count, testID }: BadgeProps) {
  const theme = useTheme();
  const style = useMemo(
    () => ({
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      borderRadius: 8,
      backgroundColor: theme.colors.danger,
      borderWidth: 2,
      borderColor: theme.colors.bg,
    }),
    [theme],
  );
  return (
    <Box testID={testID} align="center" justify="center" style={style}>
      <Text variant="microBold" color="textOnBrand">
        {String(count)}
      </Text>
    </Box>
  );
}

import { useMemo } from 'react';

import { Box, Icon, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

type Props = { checked: boolean };

/** 26px rounded square checkbox (participants picker). */
export function CheckSquare({ checked }: Props) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      width: 26,
      height: 26,
      borderRadius: theme.radii.xs,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: checked ? theme.colors.ink : theme.colors.surface,
      borderWidth: 1.5,
      borderColor: checked ? theme.colors.ink : theme.colors.dividerStrong,
    }),
    [theme, checked],
  );
  return (
    <Box style={style} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      {checked ? <Icon name="check" size={12} color="textOnInk" /> : null}
    </Box>
  );
}

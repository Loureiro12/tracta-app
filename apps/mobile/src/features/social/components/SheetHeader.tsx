import { useMemo } from 'react';

import { Box, Button, Text, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

type Props = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  testID: string;
};

/** Sheet-style header for overlays: centered title and a "Fechar" text button on the right. */
export function SheetHeader({ title, closeLabel, onClose, testID }: Props) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    }),
    [theme],
  );
  return (
    <Box style={style}>
      <Box flex={1} />
      <Text testID={`${testID}.title`} variant="subtitle" align="center" numberOfLines={1}>
        {title}
      </Text>
      <Box flex={1} align="flex-end">
        <Button testID={testID} label={closeLabel} variant="ghost" size="sm" onPress={onClose} />
      </Box>
    </Box>
  );
}

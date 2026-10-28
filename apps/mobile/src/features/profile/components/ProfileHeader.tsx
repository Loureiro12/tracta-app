import { useMemo } from 'react';

import { Avatar, Box, Button, Text, useTheme } from '@tracta/design-system';

import { profileIds } from '../profile.testids';

import type { ViewStyle } from 'react-native';

type ProfileHeaderProps = {
  name: string;
  subtitle: string;
  editLabel: string;
  onEdit: () => void;
};

/** Sticky profile header: 56px letter avatar, name (22 condensed), email line and the "Editar" pill. */
export function ProfileHeader({ name, subtitle, editLabel, onEdit }: ProfileHeaderProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.screen,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.ml,
    }),
    [theme],
  );
  return (
    <Box style={style}>
      <Avatar initial={name.charAt(0)} size={56} />
      <Box flex={1} gap="xxs">
        <Text testID={profileIds.headerName} variant="nameTitle" numberOfLines={1}>
          {name}
        </Text>
        <Text testID={profileIds.headerEmail} variant="secondary" color="text2" numberOfLines={1}>
          {subtitle}
        </Text>
      </Box>
      <Button
        testID={profileIds.headerEdit}
        label={editLabel}
        variant="secondary"
        size="sm"
        onPress={onEdit}
      />
    </Box>
  );
}

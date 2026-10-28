import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Button } from '../Button/Button';
import { Heading, Text } from '../Text/Text';

import type { MaybeTestable, Testable } from '../../testing/test-id';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

export type ScreenHeaderProps = MaybeTestable & {
  title: string;
  /** Small secondary line above the title (date). */
  eyebrow?: string;
  /** Right-aligned actions (IconButtons, Buttons). */
  actions?: ReactNode;
  /** Element rendered before the title (avatar). */
  leading?: ReactNode;
  /** Hide the bottom hairline. */
  flat?: boolean;
};

/** Fixed tab-screen header: 30px condensed title, optional eyebrow and right actions. */
export function ScreenHeader({
  title,
  eyebrow,
  actions,
  leading,
  flat = false,
  testID,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.screen,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: flat ? 0 : 1,
      borderBottomColor: theme.colors.divider,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.ml,
    }),
    [theme, flat],
  );
  return (
    <Box testID={testID} style={style}>
      {leading}
      <Box flex={1} gap="xxs">
        {eyebrow ? (
          <Text testID={testID ? `${testID}.eyebrow` : undefined} variant="secondary" color="text2">
            {eyebrow}
          </Text>
        ) : null}
        <Heading testID={testID ? `${testID}.title` : undefined} level={1} numberOfLines={1}>
          {title}
        </Heading>
      </Box>
      {actions ? (
        <Box direction="row" gap="sm" align="center">
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}

export type BackHeaderProps = Testable & {
  /** "Voltar" (i18n is the caller's job). */
  label: string;
  onPress: () => void;
  /** Optional right-aligned element. */
  trailing?: ReactNode;
};

/** Sticky "‹ Voltar" row used by full-screen overlays. */
export function BackHeader({ label, onPress, trailing, testID }: BackHeaderProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }),
    [theme],
  );
  return (
    <Box style={style}>
      <Button
        testID={testID}
        label={label}
        icon="chevron-left"
        variant="ghost"
        size="sm"
        onPress={onPress}
      />
      {trailing}
    </Box>
  );
}

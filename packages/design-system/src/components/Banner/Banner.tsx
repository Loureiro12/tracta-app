import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Button } from '../Button/Button';
import { Dot } from '../Dot/Dot';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { ViewStyle } from 'react-native';

export type BannerVariant = 'offline' | 'sync';

export type BannerProps = Testable & {
  variant: BannerVariant;
  title: string;
  description: string;
  ctaLabel?: string;
  onPressCta?: () => void;
};

/** 44px status strip under the status bar: offline (neutral) or sync failure (warn). */
export function Banner({ variant, title, description, ctaLabel, onPressCta, testID }: BannerProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: theme.spacing.screen,
      paddingRight: 10,
      backgroundColor: variant === 'sync' ? theme.colors.warnBg : theme.colors.track,
    }),
    [theme, variant],
  );
  return (
    <Box testID={testID} style={style}>
      <Dot color={variant === 'sync' ? 'warnText' : 'text3'} />
      <Box flex={1}>
        <Text testID={`${testID}.title`} variant="secondaryBold" numberOfLines={1}>
          {title}
        </Text>
        <Text testID={`${testID}.description`} variant="micro" color="text2" numberOfLines={1}>
          {description}
        </Text>
      </Box>
      {ctaLabel && onPressCta ? (
        <Button
          testID={`${testID}.cta`}
          label={ctaLabel}
          variant="surface"
          size="xs"
          onPress={onPressCta}
        />
      ) : null}
    </Box>
  );
}

import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, Icon, Pressable, Text, useTheme, VStack } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

type Props = { testID: string; title: string; hint: string; onPress: () => void };

/** The 68px ink "Create account" card-button with the brand arrow square from the welcome screen. */
export function WelcomeCta({ testID, title, hint, onPress }: Props) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.ink,
      borderRadius: theme.radii.card,
      paddingLeft: theme.spacing.screen,
      paddingRight: theme.spacing.sm + theme.spacing.xxs,
      ...theme.shadows.cta,
    }),
    [theme],
  );
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityLabel={title}
      pressedOpacity={0.85}
      style={[styles.cta, style]}
    >
      <VStack flex={1} gap="xxs">
        <Text testID={`${testID}.label`} variant="cardTitle" color="textOnInk">
          {title}
        </Text>
        <Text variant="caption" color="text2OnInk">
          {hint}
        </Text>
      </VStack>
      <Box bg="brand" radius="lg" align="center" justify="center" style={styles.arrow}>
        <Icon name="arrow-right" size={20} color="textOnBrand" />
      </Box>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cta: { height: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
  arrow: { width: 48, height: 48 },
});

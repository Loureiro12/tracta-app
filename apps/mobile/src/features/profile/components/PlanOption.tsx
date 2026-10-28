import { useMemo } from 'react';

import { Box, Chip, HStack, Pressable, Text, useTheme, VStack } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

type PlanOptionProps = {
  testID: string;
  name: string;
  description: string;
  price: string;
  tag?: string;
  selected: boolean;
  onPress: () => void;
};

/** Selectable plan card (paywall): radio, name + tag, description and price. */
export function PlanOption({
  testID,
  name,
  description,
  price,
  tag,
  selected,
  onPress,
}: PlanOptionProps) {
  const theme = useTheme();
  const cardStyle = useMemo<ViewStyle>(
    () => ({
      minHeight: 64,
      borderRadius: theme.radii.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: selected ? theme.colors.ink : theme.colors.dividerStrong,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    }),
    [theme, selected],
  );
  const radioStyle = useMemo<ViewStyle>(
    () => ({
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: selected ? theme.colors.ink : theme.colors.dividerStrong,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [theme, selected],
  );
  const dotStyle = useMemo<ViewStyle>(
    () => ({
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: selected ? theme.colors.ink : 'transparent',
    }),
    [theme, selected],
  );
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={cardStyle}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
    >
      <Box style={radioStyle}>
        <Box style={dotStyle} />
      </Box>
      <VStack flex={1} gap="xxs">
        <HStack gap="sm">
          <Text variant="cardTitleSm">{name}</Text>
          {tag ? <Chip label={tag} tone="brand" size="sm" /> : null}
        </HStack>
        <Text variant="caption" color="text2">
          {description}
        </Text>
      </VStack>
      <Text testID={`${testID}.price`} variant="subtitle" numberOfLines={1}>
        {price}
      </Text>
    </Pressable>
  );
}

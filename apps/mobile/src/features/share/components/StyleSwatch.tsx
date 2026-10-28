import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, Pressable, Text, useTheme } from '@tracta/design-system';

import type { ShareStyle } from '../model/share.mock';
import type { SemanticColors } from '@tracta/design-system';
import type { ViewStyle } from 'react-native';

export type StyleSwatchProps = {
  style: ShareStyle;
  selected: boolean;
  /** Accessibility name ("Carvão", "Areia"…). */
  label: string;
  /** Badge drawn inside the photo swatch ("FOTO"). */
  badge?: string;
  onPress: () => void;
  testID: string;
};

const swatchColor: Record<ShareStyle, keyof SemanticColors> = {
  ink: 'ink',
  sand: 'bg',
  brand: 'brand',
  photo: 'text3',
};

/** 34px colored circle; the selected one gets a white gap plus a 2px ink ring (prototype `box-shadow`). */
export function StyleSwatch({ style, selected, label, badge, onPress, testID }: StyleSwatchProps) {
  const theme = useTheme();
  const ringStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.surface,
      borderColor: selected ? theme.colors.ink : 'transparent',
    }),
    [theme, selected],
  );
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[styles.ring, ringStyle]}
    >
      <Box
        bg={swatchColor[style]}
        borderColor="outline"
        borderWidth={style === 'sand' ? 1 : 0}
        align="center"
        justify="center"
        style={styles.swatch}
      >
        {badge ? (
          <Text variant="microBold" color="textOnInk">
            {badge}
          </Text>
        ) : null}
      </Box>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, padding: 2 },
  swatch: { width: 34, height: 34, borderRadius: 17 },
});

import { StyleSheet } from 'react-native';

import { Box, Pressable, Text } from '@tracta/design-system';

import { targetGlyphs } from '../model/share.mock';

import type { ShareTarget as ShareTargetKey } from '../model/share.mock';
import type { SemanticColors } from '@tracta/design-system';

export type ShareTargetProps = {
  target: ShareTargetKey;
  label: string;
  onPress: () => void;
  testID: string;
};

const squareBg: Record<ShareTargetKey, keyof SemanticColors> = {
  stories: 'ink',
  whatsapp: 'success',
  save: 'fill2',
  more: 'fill2',
};
const squareFg: Record<ShareTargetKey, keyof SemanticColors> = {
  stories: 'textOnInk',
  whatsapp: 'textOnBrand',
  save: 'text',
  more: 'text',
};

/** Destination button: 52px rounded square with a glyph and an 11px label below. */
export function ShareTarget({ target, label, onPress, testID }: ShareTargetProps) {
  return (
    <Pressable testID={testID} onPress={onPress} accessibilityLabel={label} style={styles.column}>
      <Box bg={squareBg[target]} radius="xl" align="center" justify="center" style={styles.square}>
        <Text variant="secondaryBold" color={squareFg[target]}>
          {targetGlyphs[target]}
        </Text>
      </Box>
      <Text variant="captionSemibold" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, alignItems: 'center', gap: 6 },
  square: { width: 52, height: 52 },
});

import { Box, Pressable, Text } from '@tracta/design-system';

import type { SemanticColors } from '@tracta/design-system';

/** 44px full-width action with a token background/foreground (superset toggle, row actions). */
export function ToneButton({
  testID,
  label,
  onPress,
  bg = 'fill1',
  color = 'text',
  dimmed = false,
}: {
  testID: string;
  label: string;
  onPress: () => void;
  bg?: keyof SemanticColors;
  color?: keyof SemanticColors;
  dimmed?: boolean;
}) {
  return (
    <Box flex={1} style={dimmed ? styles.dimmed : undefined}>
      <Pressable testID={testID} onPress={onPress} accessibilityLabel={label}>
        <Box bg={bg} radius="sm" align="center" justify="center" style={styles.box}>
          <Text variant="secondaryBold" color={color} numberOfLines={1}>
            {label}
          </Text>
        </Box>
      </Pressable>
    </Box>
  );
}

const styles = { box: { height: 44 } as const, dimmed: { opacity: 0.35 } as const };

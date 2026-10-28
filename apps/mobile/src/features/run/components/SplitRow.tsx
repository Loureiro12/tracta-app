import { StyleSheet } from 'react-native';

import { Box, HStack, ProgressBar, Text } from '@tracta/design-system';

export type SplitRowProps = {
  label: string;
  pace: string;
  /** Bar width 0..1. */
  width: number;
  fastest: boolean;
  testID: string;
};

/** One split: km label · relative pace bar · pace. Fastest km is drawn in brand-text. */
export function SplitRow({ label, pace, width, fastest, testID }: SplitRowProps) {
  return (
    <HStack testID={testID} gap="sm" style={styles.row}>
      <Box style={styles.label}>
        <Text variant="secondary" color="text2" numberOfLines={1}>
          {label}
        </Text>
      </Box>
      <Box flex={1}>
        <ProgressBar value={width} height={8} color={fastest ? 'brandText' : 'brandOnDark'} />
      </Box>
      <Box style={styles.pace}>
        <Text
          testID={`${testID}.pace`}
          variant="smallSemibold"
          align="right"
          tabular
          numberOfLines={1}
        >
          {pace}
        </Text>
      </Box>
    </HStack>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 36 },
  label: { width: 48 },
  pace: { width: 72 },
});

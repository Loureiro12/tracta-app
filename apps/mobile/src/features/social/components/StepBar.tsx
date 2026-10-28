import { StyleSheet } from 'react-native';

import { Box, HStack } from '@tracta/design-system';

type Props = { step: number; total?: number };

/** Thin 4-segment progress of the challenge wizard. */
export function StepBar({ step, total = 4 }: Props) {
  return (
    <HStack gap="xs">
      {Array.from({ length: total }, (_, i) => (
        <Box key={i} flex={1} bg={i < step ? 'ink' : 'switchOff'} style={styles.segment} />
      ))}
    </HStack>
  );
}

const styles = StyleSheet.create({ segment: { height: 4, borderRadius: 2 } });

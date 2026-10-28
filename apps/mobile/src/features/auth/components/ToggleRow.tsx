import { StyleSheet } from 'react-native';

import { HStack, Switch, Text, VStack } from '@tracta/design-system';

type Props = {
  testID: string;
  label: string;
  description?: string | undefined;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Hide the bottom hairline (last row of a card). */
  last?: boolean;
  /** 48px row without description (prototype "notify me" row). */
  compact?: boolean;
};

/** Label (+ secondary description) with a switch on the right; 62–72px rows inside white cards. */
export function ToggleRow({
  testID,
  label,
  description,
  value,
  onValueChange,
  last = false,
  compact = false,
}: Props) {
  return (
    <HStack
      gap="md"
      borderColor="divider"
      style={[compact ? styles.compact : styles.row, last ? styles.last : null]}
    >
      <VStack flex={1} gap="xxs">
        <Text variant="bodySemibold">{label}</Text>
        {description ? (
          <Text variant="secondary" color="text2">
            {description}
          </Text>
        ) : null}
      </VStack>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
      />
    </HStack>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 62, paddingVertical: 8, borderBottomWidth: 1 },
  compact: { minHeight: 48, paddingVertical: 4, borderBottomWidth: 1 },
  last: { borderBottomWidth: 0 },
});

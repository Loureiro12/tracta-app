import { Text, VStack } from '@tracta/design-system';

export type RunStatProps = {
  label: string;
  value: string;
  testID: string;
};

/** Small label over a condensed tabular number (live stats and summary cards). */
export function RunStat({ label, value, testID }: RunStatProps) {
  return (
    <VStack testID={testID} gap="xxs" flex={1}>
      <Text variant="caption" color="text2" numberOfLines={1}>
        {label}
      </Text>
      <Text
        testID={`${testID}.value`}
        variant="heroSm"
        tabular
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
    </VStack>
  );
}

import { Box, Card, Text } from '@tracta/design-system';

type Props = {
  testID: string;
  label: string;
  value: string;
  /** sm = 3-up tiles under the calendar (radius 16); md = 2×2 session stats (radius 18). */
  size?: 'sm' | 'md';
};

/** White tile with a small grey label and a condensed number. Fills its row slot. */
export function StatTile({ testID, label, value, size = 'sm' }: Props) {
  return (
    <Box flex={1}>
      <Card
        testID={testID}
        radius={size === 'sm' ? 'lg' : 'xl'}
        padding={size === 'sm' ? 'md' : 'ml'}
        gap="xxs"
      >
        <Text variant="caption" color="text2" numberOfLines={1}>
          {label}
        </Text>
        <Text
          testID={`${testID}.value`}
          variant={size === 'sm' ? 'stat' : 'heroSm'}
          tabular
          numberOfLines={1}
        >
          {value}
        </Text>
      </Card>
    </Box>
  );
}

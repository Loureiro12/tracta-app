import { HStack, Text } from '@tracta/design-system';

type Props = {
  title: string;
  hint?: string;
  testID?: string;
};

/** Card title row: 15px semibold on the left, 12px grey hint on the right. */
export function CardHeader({ title, hint, testID }: Props) {
  return (
    <HStack justify="space-between" gap="sm" testID={testID}>
      <Text variant="bodySemibold" numberOfLines={1}>
        {title}
      </Text>
      {hint ? (
        <Text variant="caption" color="text2" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </HStack>
  );
}

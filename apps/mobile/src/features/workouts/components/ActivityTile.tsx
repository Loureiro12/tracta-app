import { Card, Text } from '@tracta/design-system';

/** White tile of the "Começar atividade" grid: title + one-line description. */
export function ActivityTile({
  testID,
  title,
  description,
  onPress,
}: {
  testID: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Card testID={testID} onPress={onPress} padding="lg" radius="pill" gap="xs">
      <Text variant="subtitle" numberOfLines={1}>
        {title}
      </Text>
      <Text variant="caption" color="text2" numberOfLines={1}>
        {description}
      </Text>
    </Card>
  );
}

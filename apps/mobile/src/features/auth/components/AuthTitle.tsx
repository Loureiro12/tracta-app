import { Text, VStack } from '@tracta/design-system';

type Props = { testID: string; title: string; subtitle: string };

/** 36px condensed title + 15px secondary intro used by every auth screen. */
export function AuthTitle({ testID, title, subtitle }: Props) {
  return (
    <VStack gap="sm">
      <Text testID={testID} variant="overlayTitle" accessibilityRole="header">
        {title}
      </Text>
      <Text color="text2">{subtitle}</Text>
    </VStack>
  );
}

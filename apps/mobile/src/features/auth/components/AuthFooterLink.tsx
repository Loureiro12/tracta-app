import { Button, HStack, Text } from '@tracta/design-system';

type Props = { testID: string; prompt: string; label: string; onPress: () => void };

/** "Don't have an account? Create account" line at the bottom of the forms. */
export function AuthFooterLink({ testID, prompt, label, onPress }: Props) {
  return (
    <HStack gap="xs" justify="center" pt="xs">
      <Text variant="small" color="text2">
        {prompt}
      </Text>
      <Button testID={testID} label={label} variant="ghost" size="xs" onPress={onPress} />
    </HStack>
  );
}

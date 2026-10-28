import { StyleSheet } from 'react-native';

import { Box, Button, Icon, Pressable, Text } from '@tracta/design-system';

export type ShareNudgeProps = {
  title: string;
  description?: string | undefined;
  createLabel: string;
  dismissLabel: string;
  onCreate: () => void;
  onDismiss: () => void;
  testIDs: {
    card: string;
    title: string;
    description: string;
    create: string;
    dismiss: string;
  };
};

/** Dark "Criar cartão" nudge shown after saving a workout or run (handoff §11). */
export function ShareNudge({
  title,
  description,
  createLabel,
  dismissLabel,
  onCreate,
  onDismiss,
  testIDs,
}: ShareNudgeProps) {
  return (
    <Box testID={testIDs.card} bg="ink" radius="card" shadow="floating" style={styles.card}>
      <Box flex={1} gap="xxs">
        <Text testID={testIDs.title} variant="bodyBold" color="textOnInk" numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text testID={testIDs.description} variant="caption" color="text2OnInk" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </Box>
      <Button
        testID={testIDs.create}
        label={createLabel}
        variant="brand"
        size="sm"
        onPress={onCreate}
      />
      <Pressable
        testID={testIDs.dismiss}
        onPress={onDismiss}
        accessibilityLabel={dismissLabel}
        style={styles.dismiss}
      >
        <Icon name="x" size={12} color="text2OnInk" />
      </Pressable>
    </Box>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 18,
  },
  dismiss: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});

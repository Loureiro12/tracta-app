import { Box, Button, Text } from '@tracta/design-system';

/** Centered-title top bar of builder/form/detail overlays with an optional text action on each side. */
export function OverlayHeader({
  title,
  titleTestID,
  left,
  right,
}: {
  title: string;
  titleTestID: string;
  left?: { label: string; onPress: () => void; testID: string };
  right?: { label: string; onPress: () => void; testID: string };
}) {
  return (
    <Box
      direction="row"
      align="center"
      px="md"
      pb="sm"
      bg="bg"
      borderColor="divider"
      style={styles.bar}
    >
      <Box flex={1} align="flex-start">
        {left ? (
          <Button
            testID={left.testID}
            label={left.label}
            variant="ghost"
            size="sm"
            onPress={left.onPress}
          />
        ) : null}
      </Box>
      <Text testID={titleTestID} variant="subtitle" numberOfLines={1}>
        {title}
      </Text>
      <Box flex={1} align="flex-end">
        {right ? (
          <Button
            testID={right.testID}
            label={right.label}
            variant="ghost"
            size="sm"
            onPress={right.onPress}
          />
        ) : null}
      </Box>
    </Box>
  );
}

const styles = { bar: { borderBottomWidth: 1, minHeight: 52 } as const };

import { Box } from './Box';
import { Text } from '../Text/Text';

const ID = 'ds.box';

/** Rendered by the in-app Design System gallery and exercised by e2e/flows/design-system/box.yaml */
export function BoxGallery() {
  return (
    <Box testID={`${ID}.gallery`} gap="md">
      <Box
        testID={`${ID}.surface`}
        bg="surface"
        p="lg"
        radius="md"
        borderWidth={1}
        borderColor="border"
      >
        <Text testID={`${ID}.surface.label`}>surface + border + radius md</Text>
      </Box>
      <Box testID={`${ID}.brand`} bg="brandSubtle" p="lg" radius="lg" shadow="md">
        <Text testID={`${ID}.brand.label`}>brandSubtle + shadow md</Text>
      </Box>
      <Box testID={`${ID}.row`} direction="row" gap="sm" justify="space-between">
        <Box testID={`${ID}.row.a`} bg="successSubtle" p="md" radius="sm" flex={1}>
          <Text>A</Text>
        </Box>
        <Box testID={`${ID}.row.b`} bg="warningSubtle" p="md" radius="sm" flex={1}>
          <Text>B</Text>
        </Box>
      </Box>
    </Box>
  );
}

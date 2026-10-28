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
        borderColor="dividerStrong"
      >
        <Text testID={`${ID}.surface.label`}>surface + border + radius md</Text>
      </Box>
      <Box testID={`${ID}.brand`} bg="brandTint" p="lg" radius="lg" shadow="floating">
        <Text testID={`${ID}.brand.label`}>brandTint + shadow floating</Text>
      </Box>
      <Box testID={`${ID}.row`} direction="row" gap="sm" justify="space-between">
        <Box testID={`${ID}.row.a`} bg="successTint" p="md" radius="sm" flex={1}>
          <Text>A</Text>
        </Box>
        <Box testID={`${ID}.row.b`} bg="warnBg" p="md" radius="sm" flex={1}>
          <Text>B</Text>
        </Box>
      </Box>
    </Box>
  );
}

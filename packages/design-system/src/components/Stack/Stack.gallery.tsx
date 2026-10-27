import { HStack, VStack } from './Stack';
import { Box } from '../Box/Box';
import { Text } from '../Text/Text';

const ID = 'ds.stack';

export function StackGallery() {
  return (
    <VStack testID={`${ID}.gallery`} gap="lg">
      <VStack testID={`${ID}.vertical`} gap="sm">
        <Text testID={`${ID}.vertical.1`}>vertical 1</Text>
        <Text testID={`${ID}.vertical.2`}>vertical 2</Text>
      </VStack>
      <HStack testID={`${ID}.horizontal`} gap="sm">
        <Box bg="brandSubtle" p="sm" radius="sm">
          <Text testID={`${ID}.horizontal.1`}>h1</Text>
        </Box>
        <Box bg="brandSubtle" p="sm" radius="sm">
          <Text testID={`${ID}.horizontal.2`}>h2</Text>
        </Box>
      </HStack>
    </VStack>
  );
}

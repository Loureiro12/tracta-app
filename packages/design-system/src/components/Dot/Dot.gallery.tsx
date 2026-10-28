import { Dot } from './Dot';
import { HStack, VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.dot';

export function DotGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="md">
        <Dot testID={`${ID}.brand`} />
        <Dot testID={`${ID}.sleep`} color="sleep" />
        <Dot testID={`${ID}.run`} color="run" />
        <Dot testID={`${ID}.success`} color="success" size={6} />
        <Dot testID={`${ID}.pulse`} color="danger" pulse />
        <Text testID={`${ID}.caption`} color="text2">
          last one pulses
        </Text>
      </HStack>
    </VStack>
  );
}

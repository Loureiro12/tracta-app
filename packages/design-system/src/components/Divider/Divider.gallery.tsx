import { Divider } from './Divider';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.divider';

export function DividerGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <Text testID={`${ID}.above`}>above</Text>
      <Divider testID={`${ID}.default`} />
      <Text testID={`${ID}.between`}>between</Text>
      <Divider testID={`${ID}.strong`} strong my="sm" />
      <Text testID={`${ID}.below`}>below</Text>
    </VStack>
  );
}

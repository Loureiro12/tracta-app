import { Spinner } from './Spinner';
import { HStack, VStack } from '../Stack/Stack';

const ID = 'ds.spinner';

export function SpinnerGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="md">
        <Spinner testID={`${ID}.default`} />
        <Spinner testID={`${ID}.danger`} color="danger" />
      </HStack>
    </VStack>
  );
}

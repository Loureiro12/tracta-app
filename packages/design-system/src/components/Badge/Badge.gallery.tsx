import { Badge } from './Badge';
import { HStack, VStack } from '../Stack/Stack';

const ID = 'ds.badge';

export function BadgeGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="md">
        <Badge testID={`${ID}.one`} count={1} />
        <Badge testID={`${ID}.many`} count={12} />
      </HStack>
    </VStack>
  );
}

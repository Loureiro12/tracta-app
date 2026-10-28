import { Logo } from './Logo';
import { HStack, VStack } from '../Stack/Stack';

const ID = 'ds.logo';

export function LogoGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="lg">
        <Logo testID={`${ID}.symbol`} size={64} />
        <Logo testID={`${ID}.wordmark`} size={40} wordmark />
      </HStack>
    </VStack>
  );
}

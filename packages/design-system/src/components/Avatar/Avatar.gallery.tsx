import { Avatar } from './Avatar';
import { HStack, VStack } from '../Stack/Stack';

const ID = 'ds.avatar';

export function AvatarGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="md">
        <Avatar testID={`${ID}.28`} initial="A" size={28} />
        <Avatar testID={`${ID}.40`} initial="L" size={40} />
        <Avatar testID={`${ID}.56`} initial="M" size={56} />
        <Avatar testID={`${ID}.social`} initial="J" size={40} bg="socialBg" color="social" />
      </HStack>
    </VStack>
  );
}

import { Image } from './Image';
import { HStack, VStack } from '../Stack/Stack';

const ID = 'ds.image';

/** 2×2 PNG (brand green) so the gallery shows a loaded picture without network access. */
const SAMPLE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGPQmxcNRAwQCgAfngSd2McEeAAAAABJRU5ErkJggg==';

export function ImageGallery() {
  return (
    <VStack testID={`${ID}.gallery`} gap="md">
      <HStack gap="sm">
        <VStack flex={1}>
          <Image testID={`${ID}.placeholder`} uri={null} height={140} />
        </VStack>
        <VStack flex={1}>
          <Image testID={`${ID}.photo`} uri={SAMPLE} height={140} />
        </VStack>
      </HStack>
      <Image
        testID={`${ID}.caption`}
        uri={null}
        height={250}
        radius="xl"
        caption="Photo from Oct 26"
      />
    </VStack>
  );
}

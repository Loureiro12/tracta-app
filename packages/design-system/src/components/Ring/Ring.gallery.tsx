import { Ring } from './Ring';
import { HStack, VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.ring';

export function RingGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="lg">
        <Ring testID={`${ID}.workouts`} value={0.75}>
          <Text testID={`${ID}.workouts.label`} variant="smallBold">
            3/4
          </Text>
        </Ring>
        <Ring testID={`${ID}.rest`} value={0.4} color="run" size={80} strokeWidth={10} />
      </HStack>
    </VStack>
  );
}

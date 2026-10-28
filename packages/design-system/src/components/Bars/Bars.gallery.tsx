import { Bars } from './Bars';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.bars';
const nights = [412, 445, 398, 470, 488, 455, 410].map((v, i) => ({
  value: v,
  label: ['T', 'Q', 'Q', 'S', 'S', 'D', 'S'][i],
}));

export function BarsGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <Text testID={`${ID}.label`} color="text2">
        sleep nights · steps per hour
      </Text>
      <Bars testID={`${ID}.nights`} bars={nights} color="sleep" />
      <Bars
        testID={`${ID}.hours`}
        bars={[0, 120, 640, 820, 310, 260, 410, 980, 540].map((v) => ({ value: v }))}
        height={40}
        gap={2}
        radius={2}
      />
    </VStack>
  );
}

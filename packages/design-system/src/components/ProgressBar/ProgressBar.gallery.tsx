import { ProgressBar } from './ProgressBar';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.progress-bar';

export function ProgressBarGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <Text testID={`${ID}.label`} color="text2">
        brand 60% · sleep 85% · run 100%
      </Text>
      <ProgressBar testID={`${ID}.brand`} value={0.6} />
      <ProgressBar testID={`${ID}.sleep`} value={0.85} color="sleep" />
      <ProgressBar testID={`${ID}.run`} value={1} color="run" height={8} />
    </VStack>
  );
}

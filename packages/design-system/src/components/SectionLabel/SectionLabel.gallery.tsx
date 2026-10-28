import { SectionLabel } from './SectionLabel';
import { Card } from '../Card/Card';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.section-label';

export function SectionLabelGallery() {
  return (
    <VStack testID={`${ID}.gallery`} gap="sm">
      <SectionLabel testID={`${ID}.goals`}>Metas</SectionLabel>
      <Card>
        <Text testID={`${ID}.content`}>card under the label</Text>
      </Card>
    </VStack>
  );
}

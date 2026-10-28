import { useState } from 'react';

import { Sheet } from './Sheet';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.sheet';

/** The sheet is rendered inline (not in a modal) so the gallery can show it without navigation. */
export function SheetGallery() {
  const [closed, setClosed] = useState(0);
  return (
    <VStack testID={`${ID}.gallery`}>
      <Text testID={`${ID}.closed`}>{`Closed ${closed} times`}</Text>
      <Card padding="none" radius="sheet">
        <Sheet
          testID={`${ID}.demo`}
          title="Calculadora de anilhas"
          leftLabel="Cancelar"
          rightLabel="Fechar"
          onClose={() => setClosed((n) => n + 1)}
          footer={
            <Button
              testID={`${ID}.demo.cta`}
              label="Aplicar"
              fullWidth
              size="lg"
              onPress={() => setClosed((n) => n + 1)}
            />
          }
        >
          <Text testID={`${ID}.demo.body`}>Sheet content</Text>
        </Sheet>
      </Card>
    </VStack>
  );
}

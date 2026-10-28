import { useState } from 'react';

import { Banner } from './Banner';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.banner';

export function BannerGallery() {
  const [retries, setRetries] = useState(0);
  return (
    <VStack testID={`${ID}.gallery`}>
      <Banner
        testID={`${ID}.offline`}
        variant="offline"
        title="Sem internet"
        description="2 treinos aguardando envio"
      />
      <Banner
        testID={`${ID}.sync`}
        variant="sync"
        title="Falha de sync"
        description="Último envio há 2 h"
        ctaLabel="Tentar de novo"
        onPressCta={() => setRetries((n) => n + 1)}
      />
      <Text testID={`${ID}.retries`}>{`Retries: ${retries}`}</Text>
    </VStack>
  );
}

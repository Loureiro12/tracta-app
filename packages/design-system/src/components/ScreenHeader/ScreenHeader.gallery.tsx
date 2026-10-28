import { useState } from 'react';

import { BackHeader, ScreenHeader } from './ScreenHeader';
import { Avatar } from '../Avatar/Avatar';
import { IconButton } from '../IconButton/IconButton';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.screen-header';

export function ScreenHeaderGallery() {
  const [backs, setBacks] = useState(0);
  return (
    <VStack testID={`${ID}.gallery`}>
      <ScreenHeader
        testID={`${ID}.home`}
        eyebrow="Segunda, 26 de outubro"
        title="Como estou hoje"
        actions={
          <>
            <IconButton
              testID={`${ID}.home.edit`}
              icon="sliders"
              label="Edit"
              onPress={() => setBacks((n) => n + 1)}
            />
            <IconButton
              testID={`${ID}.home.inbox`}
              icon="bell"
              label="Inbox"
              badge={2}
              onPress={() => setBacks((n) => n + 1)}
            />
          </>
        }
      />
      <ScreenHeader
        testID={`${ID}.profile`}
        title="Lucas Andrade"
        leading={<Avatar initial="L" size={56} />}
      />
      <BackHeader testID={`${ID}.back`} label="Voltar" onPress={() => setBacks((n) => n + 1)} />
      <Text testID={`${ID}.backs`}>{`Back pressed ${backs} times`}</Text>
    </VStack>
  );
}

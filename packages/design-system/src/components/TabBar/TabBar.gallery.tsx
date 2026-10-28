import { useState } from 'react';

import { TabBar } from './TabBar';
import { Box } from '../Box/Box';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { TabBarItem } from './TabBar';

const ID = 'ds.tab-bar';
const tabs: { key: string; label: string; icon: TabBarItem['icon'] }[] = [
  { key: 'home', label: 'Início', icon: 'home' },
  { key: 'health', label: 'Saúde', icon: 'heart' },
  { key: 'workouts', label: 'Treinos', icon: 'activity' },
  { key: 'history', label: 'Histórico', icon: 'calendar' },
  { key: 'profile', label: 'Perfil', icon: 'user' },
];

export function TabBarGallery() {
  const [active, setActive] = useState('home');
  return (
    <VStack testID={`${ID}.gallery`}>
      <Text testID={`${ID}.active`}>{`Active: ${active}`}</Text>
      <Box style={styles.frame}>
        <TabBar
          testID={`${ID}.bar`}
          items={tabs.map((t) => ({
            ...t,
            active: t.key === active,
            onPress: () => setActive(t.key),
            testID: `${ID}.tab.${t.key}`,
          }))}
        />
      </Box>
    </VStack>
  );
}

const styles = { frame: { height: 110 } as const };

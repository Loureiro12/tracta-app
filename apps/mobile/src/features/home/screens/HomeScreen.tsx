import { useRouter } from 'expo-router';

import { Button, Heading, Screen, Text, VStack } from '@tracta/design-system';

import { env } from '@/shared/config/env';

import { Counter } from '../components/Counter';
import { homeIds } from '../home.testids';

export function HomeScreen() {
  const router = useRouter();
  return (
    <Screen testID={homeIds.screen}>
      <Heading testID={homeIds.title}>Tracta</Heading>
      <Text color="textSecondary">Every screen ships with an end-to-end flow.</Text>
      <Counter />
      <VStack gap="sm">
        <Button
          testID={homeIds.goToSettings}
          label="Settings"
          variant="secondary"
          onPress={() => router.push('/settings')}
        />
        {env.isDev ? (
          <Button
            testID={homeIds.goToDesignSystem}
            label="Design system gallery"
            variant="ghost"
            onPress={() => router.push('/design-system')}
          />
        ) : null}
      </VStack>
    </Screen>
  );
}

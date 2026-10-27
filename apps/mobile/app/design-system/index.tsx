import { useRouter } from 'expo-router';

import { Button, Heading, Screen, VStack } from '@tracta/design-system';
import { galleryRegistry } from '@tracta/design-system/gallery';

/** Dev-only index of every design-system component gallery. Deep link: tracta://design-system */
export default function DesignSystemIndex() {
  const router = useRouter();
  return (
    <Screen testID="ds.index.screen">
      <Heading testID="ds.index.title">Design system</Heading>
      <Button testID="ds.index.back" label="Back" variant="ghost" onPress={() => router.back()} />
      <VStack gap="sm">
        {galleryRegistry.map((entry) => (
          <Button
            key={entry.slug}
            testID={`ds.index.link.${entry.slug}`}
            label={entry.name}
            variant="secondary"
            onPress={() => router.push(`/design-system/${entry.slug}`)}
          />
        ))}
      </VStack>
    </Screen>
  );
}

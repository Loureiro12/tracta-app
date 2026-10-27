import { useLocalSearchParams } from 'expo-router';

import { Heading, Screen, Text } from '@tracta/design-system';
import { findGallery } from '@tracta/design-system/gallery';

/** Renders one component gallery. Deep link: tracta://design-system/<slug> */
export default function DesignSystemGalleryRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const entry = slug ? findGallery(slug) : undefined;

  if (!entry) {
    return (
      <Screen testID="ds.gallery.not-found">
        <Text color="danger">{`No gallery registered for "${slug}".`}</Text>
      </Screen>
    );
  }

  const { Gallery } = entry;
  return (
    <Screen testID={`ds.gallery.screen.${entry.slug}`}>
      <Heading testID={`ds.gallery.title.${entry.slug}`} level={2}>
        {entry.name}
      </Heading>
      <Gallery />
    </Screen>
  );
}

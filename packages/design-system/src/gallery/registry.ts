import { BoxGallery } from '../components/Box/Box.gallery';
import { ButtonGallery } from '../components/Button/Button.gallery';
import { PressableGallery } from '../components/Pressable/Pressable.gallery';
import { ScreenGallery } from '../components/Screen/Screen.gallery';
import { StackGallery } from '../components/Stack/Stack.gallery';
import { TextGallery } from '../components/Text/Text.gallery';
import { TextFieldGallery } from '../components/TextField/TextField.gallery';

import type { ComponentType } from 'react';

export type GalleryEntry = {
  /** kebab-case slug, used in the route and the flow file name. */
  slug: string;
  /** Component folder name. */
  name: string;
  Gallery: ComponentType;
};

/**
 * Every design-system component MUST be registered here. The structure check fails otherwise.
 * The app renders each entry at /design-system/<slug> and E2E covers it in
 * apps/mobile/e2e/flows/design-system/<slug>.yaml
 */
export const galleryRegistry: readonly GalleryEntry[] = [
  { slug: 'box', name: 'Box', Gallery: BoxGallery },
  { slug: 'stack', name: 'Stack', Gallery: StackGallery },
  { slug: 'text', name: 'Text', Gallery: TextGallery },
  { slug: 'pressable', name: 'Pressable', Gallery: PressableGallery },
  { slug: 'button', name: 'Button', Gallery: ButtonGallery },
  { slug: 'text-field', name: 'TextField', Gallery: TextFieldGallery },
  { slug: 'screen', name: 'Screen', Gallery: ScreenGallery },
];

export function findGallery(slug: string): GalleryEntry | undefined {
  return galleryRegistry.find((entry) => entry.slug === slug);
}

import { AvatarGallery } from '../components/Avatar/Avatar.gallery';
import { BadgeGallery } from '../components/Badge/Badge.gallery';
import { BannerGallery } from '../components/Banner/Banner.gallery';
import { BarsGallery } from '../components/Bars/Bars.gallery';
import { BoxGallery } from '../components/Box/Box.gallery';
import { ButtonGallery } from '../components/Button/Button.gallery';
import { CardGallery } from '../components/Card/Card.gallery';
import { CheckCircleGallery } from '../components/CheckCircle/CheckCircle.gallery';
import { ChipGallery } from '../components/Chip/Chip.gallery';
import { DividerGallery } from '../components/Divider/Divider.gallery';
import { DotGallery } from '../components/Dot/Dot.gallery';
import { FloatingBarGallery } from '../components/FloatingBar/FloatingBar.gallery';
import { IconGallery } from '../components/Icon/Icon.gallery';
import { IconButtonGallery } from '../components/IconButton/IconButton.gallery';
import { ListRowGallery } from '../components/ListRow/ListRow.gallery';
import { LogoGallery } from '../components/Logo/Logo.gallery';
import { PressableGallery } from '../components/Pressable/Pressable.gallery';
import { ProgressBarGallery } from '../components/ProgressBar/ProgressBar.gallery';
import { RingGallery } from '../components/Ring/Ring.gallery';
import { ScreenGallery } from '../components/Screen/Screen.gallery';
import { ScreenHeaderGallery } from '../components/ScreenHeader/ScreenHeader.gallery';
import { SectionLabelGallery } from '../components/SectionLabel/SectionLabel.gallery';
import { SegmentedGallery } from '../components/Segmented/Segmented.gallery';
import { SheetGallery } from '../components/Sheet/Sheet.gallery';
import { StackGallery } from '../components/Stack/Stack.gallery';
import { StepperGallery } from '../components/Stepper/Stepper.gallery';
import { SwitchGallery } from '../components/Switch/Switch.gallery';
import { TabBarGallery } from '../components/TabBar/TabBar.gallery';
import { TextGallery } from '../components/Text/Text.gallery';
import { TextFieldGallery } from '../components/TextField/TextField.gallery';
import { ToastGallery } from '../components/Toast/Toast.gallery';

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
  { slug: 'icon', name: 'Icon', Gallery: IconGallery },
  { slug: 'icon-button', name: 'IconButton', Gallery: IconButtonGallery },
  { slug: 'avatar', name: 'Avatar', Gallery: AvatarGallery },
  { slug: 'dot', name: 'Dot', Gallery: DotGallery },
  { slug: 'badge', name: 'Badge', Gallery: BadgeGallery },
  { slug: 'divider', name: 'Divider', Gallery: DividerGallery },
  { slug: 'card', name: 'Card', Gallery: CardGallery },
  { slug: 'section-label', name: 'SectionLabel', Gallery: SectionLabelGallery },
  { slug: 'list-row', name: 'ListRow', Gallery: ListRowGallery },
  { slug: 'chip', name: 'Chip', Gallery: ChipGallery },
  { slug: 'segmented', name: 'Segmented', Gallery: SegmentedGallery },
  { slug: 'switch', name: 'Switch', Gallery: SwitchGallery },
  { slug: 'progress-bar', name: 'ProgressBar', Gallery: ProgressBarGallery },
  { slug: 'stepper', name: 'Stepper', Gallery: StepperGallery },
  { slug: 'check-circle', name: 'CheckCircle', Gallery: CheckCircleGallery },
  { slug: 'bars', name: 'Bars', Gallery: BarsGallery },
  { slug: 'ring', name: 'Ring', Gallery: RingGallery },
  { slug: 'toast', name: 'Toast', Gallery: ToastGallery },
  { slug: 'banner', name: 'Banner', Gallery: BannerGallery },
  { slug: 'floating-bar', name: 'FloatingBar', Gallery: FloatingBarGallery },
  { slug: 'sheet', name: 'Sheet', Gallery: SheetGallery },
  { slug: 'screen-header', name: 'ScreenHeader', Gallery: ScreenHeaderGallery },
  { slug: 'tab-bar', name: 'TabBar', Gallery: TabBarGallery },
  { slug: 'logo', name: 'Logo', Gallery: LogoGallery },
];

export function findGallery(slug: string): GalleryEntry | undefined {
  return galleryRegistry.find((entry) => entry.slug === slug);
}

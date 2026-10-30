import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { env } from '@/shared/config/env';

import { SAMPLE_PHOTO_PNG } from './sample-photo';

import type { photos } from '@tracta/api';

export type PickedPhoto = { data: ArrayBuffer; contentType: photos.PhotoContentType };

export type PhotoOrigin = 'camera' | 'library';

/** Where progress photos come from. `null` = the user cancelled or denied access. */
export type PhotoSource = { pick: (origin: PhotoOrigin) => Promise<PickedPhoto | null> };

/** Longest side after resizing: enough for a phone screen, small enough to upload quickly. */
const MAX_SIDE = 1440;
const JPEG_QUALITY = 0.7;

async function launch(origin: PhotoOrigin): Promise<ImagePicker.ImagePickerAsset | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  if (origin === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      try {
        const shot = await ImagePicker.launchCameraAsync(options);
        return shot.canceled ? null : (shot.assets[0] ?? null);
      } catch {
        // No camera (simulator): fall through to the library.
      }
    }
  }
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const picked = await ImagePicker.launchImageLibraryAsync(options);
  return picked.canceled ? null : (picked.assets[0] ?? null);
}

/** Camera or library, then resized and re-encoded as JPEG (also strips EXIF/location). */
const nativeSource: PhotoSource = {
  async pick(origin) {
    const asset = await launch(origin);
    if (!asset) return null;
    const landscape = asset.width > asset.height;
    const context = ImageManipulator.manipulate(asset.uri);
    if (Math.max(asset.width, asset.height) > MAX_SIDE)
      context.resize(landscape ? { width: MAX_SIDE } : { height: MAX_SIDE });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
    const data = await new File(saved.uri).arrayBuffer();
    return { data, contentType: 'image/jpeg' };
  },
};

/** E2E builds: Maestro cannot drive the camera or the picker, so a bundled sample is "taken". */
const fakeSource: PhotoSource = {
  pick: () => Promise.resolve({ data: SAMPLE_PHOTO_PNG.slice().buffer, contentType: 'image/png' }),
};

export const photoSource: PhotoSource = env.isE2E ? fakeSource : nativeSource;

import { useState } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  HStack,
  Image,
  Pressable,
  Screen,
  Segmented,
  Text,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatDate, formatNumber, useTranslation } from '@/shared/i18n';

import { useAddPhoto, useDeletePhoto, useProgressPhotos } from '../api/usePhotos';
import { useProfileStore } from '../model/profile.store';
import { profileIds as ids } from '../profile.testids';

import type { ProgressPhoto } from '../api/usePhotos';
import type { PhotoOrigin } from '../lib/photo-source';

type PhotosTab = 'list' | 'compare';

const kg1 = (value: number) =>
  formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "Oct 26" / "26 de out." from a YYYY-MM-DD day. */
function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return formatDate(new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1), { day: 'numeric', month: 'short' });
}

export function PhotosScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const compareA = useProfileStore((s) => s.compareA);
  const compareB = useProfileStore((s) => s.compareB);
  const cycleCompare = useProfileStore((s) => s.cycleCompare);
  const photoAdded = useProfileStore((s) => s.photoAdded);
  const query = useProgressPhotos();
  const addPhoto = useAddPhoto();
  const deletePhoto = useDeletePhoto();
  const [tab, setTab] = useState<PhotosTab>('list');
  const [armed, setArmed] = useState<string | null>(null);
  const photos = query.data ?? [];
  const n = photos.length;

  const tabs = [
    { value: 'list', label: t('photos.tabList') },
    { value: 'compare', label: t('photos.tabCompare') },
  ] as const;

  const aIndex = Math.min(compareA, n - 1);
  const bIndex = Math.min(compareB, n - 1);
  const a = photos[aIndex];
  const b = photos[bIndex];
  // Newest first: the lower index is the later photo.
  const later = aIndex <= bIndex ? a : b;
  const earlier = later === a ? b : a;
  const diff =
    later?.weightKg != null && earlier?.weightKg != null
      ? Math.round((later.weightKg - earlier.weightKg) * 10) / 10
      : null;
  const diffLabel = diff === null ? '—' : `${diff > 0 ? '+' : ''}${kg1(diff)}`;
  const weightLabel = (photo: ProgressPhoto) =>
    photo.weightKg === null
      ? t('photos.noWeight')
      : t('photos.weight', { value: kg1(photo.weightKg) });

  const onAdd = (origin: PhotoOrigin) => {
    if (addPhoto.isPending) return;
    addPhoto.mutate(origin, {
      onSuccess: (photo) => {
        if (!photo) return;
        photoAdded();
        showToast(t('photos.addedToast'));
      },
      onError: () => showToast(t('photos.addFailed')),
    });
  };

  /** Tapping a tile arms it; a second tap deletes the photo. */
  const onTile = (photo: ProgressPhoto) => {
    if (armed !== photo.id) {
      setArmed(photo.id);
      return;
    }
    setArmed(null);
    deletePhoto.mutate(photo.id, {
      onSuccess: () => showToast(t('photos.deletedToast')),
      onError: () => showToast(t('state.saveFailed')),
    });
  };

  const renderCompare = (first: ProgressPhoto, second: ProgressPhoto) => (
    <VStack gap="md">
      <HStack gap="sm" align="flex-start">
        {compareSlots(first, second).map(({ slot, photo, swapId }) => (
          <VStack key={slot} flex={1} gap="xs">
            <Image
              uri={photo.url}
              height={250}
              radius="xl"
              caption={t('photos.placeholder', { date: dayLabel(photo.takenOn) })}
            />
            <Button
              testID={swapId}
              label={t('photos.swap', { date: dayLabel(photo.takenOn) })}
              variant="onInk"
              size="sm"
              fullWidth
              onPress={() => cycleCompare(slot, n)}
            />
          </VStack>
        ))}
      </HStack>
      <Card testID={ids.photosDiff} radius="pill" px="xl" py="xs" gap="none">
        <HStack gap="xs" style={styles.diffRow}>
          <Box style={styles.grow}>
            <Text variant="small" color="text2">
              {t('photos.diffWeight')}
            </Text>
          </Box>
          <Box style={styles.col}>
            <Text variant="smallSemibold" align="right" numberOfLines={1}>
              {weightLabel(first)}
            </Text>
          </Box>
          <Box style={styles.col}>
            <Text variant="smallSemibold" align="right" numberOfLines={1}>
              {weightLabel(second)}
            </Text>
          </Box>
          <Box style={styles.colSm}>
            <Text
              testID={`${ids.photosDiff}.value`}
              variant="smallBold"
              align="right"
              color={diff === null || diff <= 0 ? 'brandText' : 'warnText'}
              numberOfLines={1}
            >
              {t('photos.diffValue', { value: diffLabel })}
            </Text>
          </Box>
        </HStack>
      </Card>
      <Text testID={ids.photosSpan} variant="caption" color="text2">
        {first === second
          ? t('photos.spanSame')
          : t('photos.span', {
              from: earlier ? dayLabel(earlier.takenOn) : '',
              to: later ? dayLabel(later.takenOn) : '',
            })}
      </Text>
    </VStack>
  );

  /** Loading / failed text, or null once the list is there. */
  const status = query.isPending
    ? t('photos.loading')
    : query.isError
      ? t('photos.loadFailed')
      : null;
  const statusText = (text: string) => (
    <Text variant="secondary" color="text2">
      {text}
    </Text>
  );

  return (
    <Screen
      testID={ids.photosScreen}
      header={
        <BackHeader
          testID={ids.photosBack}
          label={t('nav.backToProfile')}
          onPress={() => router.back()}
        />
      }
    >
      <Text variant="overlayTitle">{t('photos.title')}</Text>
      <Segmented testID={ids.photosTabs} options={tabs} value={tab} onChange={setTab} />

      {tab === 'compare' ? (
        status ? (
          statusText(status)
        ) : a && b && n >= 2 ? (
          renderCompare(a, b)
        ) : (
          statusText(t('photos.compareEmpty'))
        )
      ) : (
        <VStack gap="md">
          <VStack gap="sm">
            <Button
              testID={ids.photosAdd}
              label={t('photos.add')}
              icon="camera"
              size="lg"
              fullWidth
              loading={addPhoto.isPending && addPhoto.variables === 'camera'}
              onPress={() => onAdd('camera')}
            />
            <Button
              testID={ids.photosAddLibrary}
              label={t('photos.addLibrary')}
              icon="image"
              variant="secondary"
              size="md"
              fullWidth
              loading={addPhoto.isPending && addPhoto.variables === 'library'}
              onPress={() => onAdd('library')}
            />
          </VStack>
          {status ? statusText(status) : null}
          {query.isSuccess && n === 0 ? statusText(t('photos.empty')) : null}
          <Box testID={ids.photosGrid} direction="row" wrap="wrap" gap="sm">
            {photos.map((photo) => (
              <Pressable
                key={photo.id}
                testID={`${ids.photosGrid}.${photo.id}`}
                style={styles.tile}
                accessibilityHint={t('photos.deleteHint')}
                onPress={() => onTile(photo)}
              >
                <VStack gap="xs">
                  <Image uri={photo.url} height={140} />
                  <Text testID={`${ids.photosGrid}.${photo.id}.date`} variant="captionSemibold">
                    {armed === photo.id ? t('photos.deleteArmed') : dayLabel(photo.takenOn)}
                  </Text>
                  <Text
                    testID={`${ids.photosGrid}.${photo.id}.weight`}
                    variant="micro"
                    color="text2"
                  >
                    {weightLabel(photo)}
                  </Text>
                </VStack>
              </Pressable>
            ))}
          </Box>
          <Card radius="pill" padding="lg" gap="xs">
            <Text variant="smallBold">{t('photos.privateTitle')}</Text>
            <Text variant="secondary" color="text2">
              {t('photos.privateDescription')}
            </Text>
          </Card>
        </VStack>
      )}
    </Screen>
  );
}

const compareSlots = (first: ProgressPhoto, second: ProgressPhoto) =>
  [
    { slot: 'a', photo: first, swapId: ids.photosSwapA },
    { slot: 'b', photo: second, swapId: ids.photosSwapB },
  ] as const;

const styles = StyleSheet.create({
  // 3 columns in a 350pt content width with 8pt gaps.
  tile: { width: '31%' },
  diffRow: { minHeight: 46 },
  grow: { flex: 1 },
  col: { width: 64 },
  colSm: { width: 52 },
});

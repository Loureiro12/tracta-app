import { useState } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  HStack,
  Screen,
  Segmented,
  Text,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatNumber, useTranslation } from '@/shared/i18n';

import { PhotoPlaceholder } from '../components/PhotoPlaceholder';
import { useProfileStore } from '../model/profile.store';
import { profileIds as ids } from '../profile.testids';

type PhotosTab = 'list' | 'compare';

const kg1 = (value: number) =>
  formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function PhotosScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const photos = useProfileStore((s) => s.photos);
  const compareA = useProfileStore((s) => s.compareA);
  const compareB = useProfileStore((s) => s.compareB);
  const cycleCompare = useProfileStore((s) => s.cycleCompare);
  const addTodayPhoto = useProfileStore((s) => s.addTodayPhoto);
  const [tab, setTab] = useState<PhotosTab>('list');

  const tabs = [
    { value: 'list', label: t('photos.tabList') },
    { value: 'compare', label: t('photos.tabCompare') },
  ] as const;

  const a = photos[Math.min(compareA, photos.length - 1)];
  const b = photos[Math.min(compareB, photos.length - 1)];
  const aIndex = a ? photos.indexOf(a) : 0;
  const bIndex = b ? photos.indexOf(b) : 0;
  // Newest first: the lower index is the later photo.
  const later = aIndex <= bIndex ? a : b;
  const earlier = later === a ? b : a;
  const diff = later && earlier ? Math.round((later.kg - earlier.kg) * 10) / 10 : 0;
  const diffLabel = `${diff > 0 ? '+' : ''}${kg1(diff)}`;

  const onAdd = () => {
    addTodayPhoto();
    showToast(t('photos.addedToast'));
  };

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

      {tab === 'compare' && a && b ? (
        <VStack gap="md">
          <HStack gap="sm" align="flex-start">
            <VStack flex={1} gap="xs">
              <PhotoPlaceholder height={250} caption={t('photos.placeholder', { date: a.date })} />
              <Button
                testID={ids.photosSwapA}
                label={t('photos.swap', { date: a.date })}
                variant="onInk"
                size="sm"
                fullWidth
                onPress={() => cycleCompare('a')}
              />
            </VStack>
            <VStack flex={1} gap="xs">
              <PhotoPlaceholder height={250} caption={t('photos.placeholder', { date: b.date })} />
              <Button
                testID={ids.photosSwapB}
                label={t('photos.swap', { date: b.date })}
                variant="onInk"
                size="sm"
                fullWidth
                onPress={() => cycleCompare('b')}
              />
            </VStack>
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
                  {t('photos.weight', { value: kg1(a.kg) })}
                </Text>
              </Box>
              <Box style={styles.col}>
                <Text variant="smallSemibold" align="right" numberOfLines={1}>
                  {t('photos.weight', { value: kg1(b.kg) })}
                </Text>
              </Box>
              <Box style={styles.colSm}>
                <Text
                  testID={`${ids.photosDiff}.value`}
                  variant="smallBold"
                  align="right"
                  color={diff <= 0 ? 'brandText' : 'warnText'}
                  numberOfLines={1}
                >
                  {t('photos.diffValue', { value: diffLabel })}
                </Text>
              </Box>
            </HStack>
          </Card>
          <Text testID={ids.photosSpan} variant="caption" color="text2">
            {a === b
              ? t('photos.spanSame')
              : t('photos.span', { from: earlier?.date, to: later?.date })}
          </Text>
        </VStack>
      ) : (
        <VStack gap="md">
          <Button
            testID={ids.photosAdd}
            label={t('photos.add')}
            size="lg"
            fullWidth
            onPress={onAdd}
          />
          <Box testID={ids.photosGrid} direction="row" wrap="wrap" gap="sm">
            {photos.map((photo) => (
              <VStack key={photo.id} gap="xs" style={styles.tile}>
                <PhotoPlaceholder height={140} />
                <Text variant="captionSemibold">{photo.date}</Text>
                <Text variant="micro" color="text2">
                  {t('photos.weight', { value: kg1(photo.kg) })}
                </Text>
              </VStack>
            ))}
          </Box>
          <Card radius="pill" padding="lg" gap="xs">
            <Text variant="smallBold">{t('photos.localTitle')}</Text>
            <Text variant="secondary" color="text2">
              {t('photos.localDescription')}
            </Text>
          </Card>
        </VStack>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 3 columns in a 350pt content width with 8pt gaps.
  tile: { width: '31%', flexGrow: 1 },
  diffRow: { minHeight: 46 },
  grow: { flex: 1 },
  col: { width: 64 },
  colSm: { width: 52 },
});

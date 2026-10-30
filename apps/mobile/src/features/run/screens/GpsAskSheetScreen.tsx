import { useCallback, useMemo, useRef } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Box, Pressable, Text, VStack, useTheme } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';
import { locationSource } from '@/shared/location';

import { resolveActivity } from '../model/run.mock';
import { useRunStore } from '../model/run.store';
import { runIds } from '../run.testids';

import type { ViewStyle } from 'react-native';

export type GpsAskSheetScreenProps = {
  /** `?type=` of the activity to start after the choice. */
  type?: string | undefined;
};

/** Location permission dialog (system-alert style) shown before the first GPS activity. */
export function GpsAskSheetScreen({ type }: GpsAskSheetScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation('run');
  const startRun = useRunStore((s) => s.startRun);
  const showToast = useFeedbackStore((s) => s.showToast);
  const busy = useRef(false);

  const rowStyle = useMemo<ViewStyle>(
    () => ({
      height: 50,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    }),
    [theme],
  );

  // "Allow" asks the OS for real; a denial falls back to an activity without GPS (duration only).
  const begin = useCallback(
    async (wantsGps: boolean) => {
      if (busy.current) return;
      busy.current = true;
      const activity = resolveActivity(type);
      const permission = wantsGps
        ? await locationSource.requestPermission().catch(() => 'denied' as const)
        : 'denied';
      const gps = permission !== 'denied';
      if (wantsGps && !gps) showToast(t('gps.deniedToast'));
      startRun(activity.type, gps, activity.intervals, {
        title: t('tracking.title'),
        body: t('tracking.body'),
      });
      router.replace({ pathname: '/run', params: { type: type ?? activity.type } });
    },
    [type, startRun, router, showToast, t],
  );

  return (
    <Box testID={runIds.gpsScreen} flex={1} bg="overlay" align="center" justify="center" p="3xl">
      <Box bg="surface" radius="card" style={styles.dialog}>
        <VStack px="screen" pt="2xl" pb="lg" gap="sm">
          <Text variant="subtitle" align="center">
            {t('gps.title')}
          </Text>
          <Text variant="secondary" color="text2" align="center">
            {t('gps.body')}
          </Text>
        </VStack>
        <Pressable
          testID={runIds.gpsAllow}
          accessibilityLabel={t('gps.allow')}
          style={rowStyle}
          onPress={() => void begin(true)}
        >
          <Text testID={`${runIds.gpsAllow}.label`} variant="button" color="brandText">
            {t('gps.allow')}
          </Text>
        </Pressable>
        <Pressable
          testID={runIds.gpsOnce}
          accessibilityLabel={t('gps.once')}
          style={rowStyle}
          onPress={() => void begin(true)}
        >
          <Text testID={`${runIds.gpsOnce}.label`} variant="bodyLg" color="brandText">
            {t('gps.once')}
          </Text>
        </Pressable>
        <Pressable
          testID={runIds.gpsDeny}
          accessibilityLabel={t('gps.deny')}
          style={rowStyle}
          onPress={() => void begin(false)}
        >
          <Text testID={`${runIds.gpsDeny}.label`} variant="bodyLg">
            {t('gps.deny')}
          </Text>
        </Pressable>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  dialog: { width: 290, overflow: 'hidden' },
});

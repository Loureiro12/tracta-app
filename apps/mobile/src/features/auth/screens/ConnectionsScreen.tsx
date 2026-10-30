import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  HStack,
  ListRow,
  ProgressBar,
  Screen,
  Text,
  VStack,
} from '@tracta/design-system';

import { useHealthConnection } from '@/features/health';
import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { authIds } from '../auth.testids';
import { AuthBackButton } from '../components/AuthBackButton';
import { AuthTitle } from '../components/AuthTitle';
import { ToggleRow } from '../components/ToggleRow';
import { FOUND_SOURCES } from '../model/auth.mock';
import { useAuthStore } from '../model/auth.store';

/** `onboarding` = last step after sign-up (eyebrow + "set up later"); `settings` = opened from Profile. */
export type ConnectionsMode = 'onboarding' | 'settings';

type Props = { mode: ConnectionsMode };

const IMPORT_PROGRESS = 0.62;

export function ConnectionsScreen({ mode }: Props) {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const showToast = useFeedbackStore((s) => s.showToast);
  const healthBusy = useAuthStore((s) => s.healthBusy);
  const { data: connection } = useHealthConnection();
  const health = healthBusy ? 'busy' : connection ? 'on' : 'off';
  const googleNotify = useAuthStore((s) => s.googleNotify);
  const gps = useAuthStore((s) => s.gps);
  const notifications = useAuthStore((s) => s.notifications);
  const setGoogleNotify = useAuthStore((s) => s.setGoogleNotify);
  const setGps = useAuthStore((s) => s.setGps);
  const setNotifications = useAuthStore((s) => s.setNotifications);

  const settings = mode === 'settings';
  const finish = () => (settings ? router.back() : router.replace('/'));
  const openHealth = () => router.push('/connect/health');
  const ctaLabel = settings
    ? t('connect.cta.done')
    : health === 'on'
      ? t('connect.cta.start')
      : t('connect.cta.continue');

  const footer = (
    <Box px="screen" pt="md" pb="3xl" gap="xs" borderColor="divider" style={styles.footer}>
      <Button
        testID={authIds.connectContinue}
        label={ctaLabel}
        size="lg"
        fullWidth
        onPress={finish}
      />
      {settings ? null : (
        <Button
          testID={authIds.connectSkip}
          label={t('connect.skip')}
          variant="ghost"
          size="sm"
          fullWidth
          onPress={finish}
        />
      )}
    </Box>
  );

  return (
    <Screen
      testID={authIds.connectScreen}
      header={settings ? <AuthBackButton testID={authIds.connectBack} /> : null}
      footer={footer}
    >
      <VStack gap="ml" pt="xs">
        {settings ? null : (
          <Text testID={authIds.connectEyebrow} variant="captionBold" color="brandText" uppercase>
            {t('connect.eyebrow')}
          </Text>
        )}
        <AuthTitle
          testID={authIds.connectTitle}
          title={t('connect.title')}
          subtitle={t('connect.subtitle')}
        />

        <Card>
          <HStack justify="space-between" gap="sm">
            <Text variant="subtitle">{t('connect.health.title')}</Text>
            <Chip
              testID={authIds.connectHealthStatus}
              label={t(`connect.health.status.${health}`)}
              tone={health === 'on' ? 'brand' : 'neutral'}
              size="sm"
            />
          </HStack>
          <Text variant="small" color="text2">
            {t('connect.health.description')}
          </Text>
          {health === 'off' ? (
            <Button
              testID={authIds.connectHealthConnect}
              label={t('connect.health.connect')}
              size="md"
              fullWidth
              onPress={openHealth}
            />
          ) : null}
          {health === 'busy' ? (
            <VStack testID={authIds.connectHealthProgress} gap="sm">
              <ProgressBar value={IMPORT_PROGRESS} />
              <Text variant="secondary" color="text2">
                {t('connect.health.importing')}
              </Text>
            </VStack>
          ) : null}
          {health === 'on' ? (
            <VStack testID={authIds.connectHealthFound} gap="none">
              <Divider />
              {FOUND_SOURCES.map((id) => (
                <ListRow
                  key={id}
                  testID={`${authIds.connectHealthFound}.${id}`}
                  label={t(`connect.health.found.${id}.name`)}
                  value={t(`connect.health.found.${id}.source`)}
                  valueColor="text2"
                />
              ))}
              <Box align="flex-start" pt="xs">
                <Button
                  testID={authIds.connectHealthReview}
                  label={t('connect.health.review')}
                  variant="ghost"
                  size="sm"
                  onPress={openHealth}
                />
              </Box>
            </VStack>
          ) : null}
        </Card>

        <Card>
          <HStack justify="space-between" gap="sm">
            <Text variant="subtitle">{t('connect.google.title')}</Text>
            <Chip label={t('connect.google.status')} tone="warn" size="sm" />
          </HStack>
          <Text variant="small" color="text2">
            {t('connect.google.description')}
          </Text>
          <Divider />
          <ToggleRow
            testID={authIds.connectGoogleNotify}
            label={t('connect.google.notify')}
            value={googleNotify}
            onValueChange={setGoogleNotify}
            compact
            last
          />
        </Card>

        <Card padding="xs" px="xl" gap="none">
          <ToggleRow
            testID={authIds.connectGps}
            label={t('connect.gps.title')}
            description={t('connect.gps.description')}
            value={gps}
            onValueChange={(on) => {
              setGps(on);
              if (on) showToast(t('connect.gps.toast'));
            }}
          />
          <ToggleRow
            testID={authIds.connectNotifications}
            label={t('connect.notifications.title')}
            description={t('connect.notifications.description')}
            value={notifications}
            onValueChange={(on) => {
              setNotifications(on);
              if (on) showToast(t('connect.notifications.toast'));
            }}
            last
          />
        </Card>
      </VStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1 },
});

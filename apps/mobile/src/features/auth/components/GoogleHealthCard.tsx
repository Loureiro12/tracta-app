import { Button, Card, Chip, Divider, HStack, Text } from '@tracta/design-system';

import {
  HealthPermissionDenied,
  useConnectGoogleHealth,
  useDisconnectGoogleHealth,
  useGoogleHealthLinked,
  useHealthConnection,
} from '@/features/health';
import { useFeedbackStore } from '@/shared/feedback';
import { GoogleHealthNoProfile, isGoogleHealthAvailable } from '@/shared/health';
import { useTranslation } from '@/shared/i18n';

import { authIds } from '../auth.testids';

/**
 * Google Health on iOS, through its API. It explains what is read before Google's consent page, as
 * Google asks. Where it isn't offered (Android reads it from Health Connect), it only says so.
 */
export function GoogleHealthCard() {
  const { t } = useTranslation('auth');
  const showToast = useFeedbackStore((s) => s.showToast);
  const available = isGoogleHealthAvailable();
  const { data: connection } = useHealthConnection();
  const connected = connection?.source === 'google_health';
  const { data: linked } = useGoogleHealthLinked(connected);
  const connect = useConnectGoogleHealth();
  const disconnect = useDisconnectGoogleHealth();
  const needsReconnect = connected && linked === false;

  const onConnect = () =>
    connect.mutate(undefined, {
      onSuccess: () => showToast(t('connect.google.connectedToast')),
      onError: (error) => {
        // Backing out of Google's page is a choice, not something to report.
        if (error instanceof HealthPermissionDenied) return;
        showToast(
          error instanceof GoogleHealthNoProfile
            ? t('connect.google.noProfileToast')
            : t('connect.google.failedToast'),
        );
      },
    });
  const onDisconnect = () =>
    disconnect.mutate(undefined, {
      onSuccess: () => showToast(t('connect.google.disconnectedToast')),
      onError: () => showToast(t('connect.google.failedToast')),
    });

  const status = !available
    ? t('connect.google.statusValidating')
    : needsReconnect
      ? t('connect.google.statusReconnect')
      : connected
        ? t('connect.google.statusOn')
        : t('connect.google.statusOff');
  const tone = !available || needsReconnect ? 'warn' : connected ? 'brand' : 'neutral';

  return (
    <Card>
      <HStack justify="space-between" gap="sm">
        <Text variant="subtitle">{t('connect.google.title')}</Text>
        <Chip testID={authIds.connectGoogleStatus} label={status} tone={tone} size="sm" />
      </HStack>
      <Text variant="small" color="text2">
        {available ? t('connect.google.description') : t('connect.google.descriptionValidating')}
      </Text>
      {available ? (
        <>
          <Divider />
          {connected && !needsReconnect ? (
            <Button
              testID={authIds.connectGoogleDisconnect}
              label={t('connect.google.disconnect')}
              variant="surface"
              size="md"
              fullWidth
              loading={disconnect.isPending}
              onPress={onDisconnect}
            />
          ) : (
            <Button
              testID={authIds.connectGoogleConnect}
              label={needsReconnect ? t('connect.google.reconnect') : t('connect.google.connect')}
              size="md"
              fullWidth
              loading={connect.isPending}
              onPress={onConnect}
            />
          )}
        </>
      ) : null}
    </Card>
  );
}

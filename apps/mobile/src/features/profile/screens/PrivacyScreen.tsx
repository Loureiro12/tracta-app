import { useState } from 'react';

import { useRouter } from 'expo-router';

import { BackHeader, Button, Card, ListGroup, ListRow, Screen, Text } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useDeleteAccount, useDeleteHistory } from '../api/useAccountActions';
import { profileRoutes } from '../model/profile.routes';
import { useProfileStore } from '../model/profile.store';
import { profileIds as ids } from '../profile.testids';

type PrivacyAction = 'export' | 'health' | 'history' | 'account';

export function PrivacyScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const healthConnected = useProfileStore((s) => s.healthConnected);
  const disconnectHealth = useProfileStore((s) => s.disconnectHealth);
  const deleteHistory = useDeleteHistory();
  const deleteAccount = useDeleteAccount();
  const [armed, setArmed] = useState<PrivacyAction | null>(null);
  const onError = () => showToast(t('state.saveFailed'));

  const run = (action: PrivacyAction) => {
    switch (action) {
      case 'export':
        // No export backend yet: the file is not generated.
        showToast(t('privacy.exportToast'));
        return;
      case 'health':
        disconnectHealth();
        showToast(t('privacy.disconnectHealthToast'));
        return;
      case 'history':
        deleteHistory.mutate(undefined, {
          onSuccess: () => showToast(t('privacy.deleteHistoryToast')),
          onError,
        });
        return;
      case 'account':
        // mutateAsync: the sign-out unmounts this screen, which would drop mutate callbacks.
        deleteAccount.mutateAsync().then(() => {
          showToast(t('privacy.deleteAccountToast'));
          router.replace(profileRoutes.welcome);
        }, onError);
        return;
    }
  };

  /** Destructive actions need a second tap: the label changes to "Toque de novo para confirmar". */
  const press = (action: PrivacyAction) => {
    if (action === 'export') return run(action);
    if (armed !== action) {
      setArmed(action);
      return;
    }
    setArmed(null);
    run(action);
  };

  const actions: { key: PrivacyAction; label: string; description: string }[] = [
    { key: 'export', label: t('privacy.export'), description: t('privacy.exportDescription') },
    {
      key: 'health',
      label: t('privacy.disconnectHealth'),
      description: t('privacy.disconnectHealthDescription'),
    },
    {
      key: 'history',
      label: t('privacy.deleteHistory'),
      description: t('privacy.deleteHistoryDescription'),
    },
    {
      key: 'account',
      label: t('privacy.deleteAccount'),
      description: t('privacy.deleteAccountDescription'),
    },
  ];

  return (
    <Screen
      testID={ids.privacyScreen}
      header={
        <BackHeader
          testID={ids.privacyBack}
          label={t('nav.backToProfile')}
          onPress={() => router.back()}
          trailing={
            <Button
              testID={ids.privacyDone}
              label={t('nav.done')}
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
            />
          }
        />
      }
    >
      <Text variant="overlayTitle">{t('privacy.title')}</Text>
      <Card padding="xl" py="lg" gap="xs">
        <Text variant="bodySemibold">{t('privacy.whereTitle')}</Text>
        <Text variant="small" color="text2">
          {t('privacy.whereDescription')}
        </Text>
      </Card>

      <Text variant="secondarySemibold">{t('privacy.outSection')}</Text>
      <ListGroup testID={ids.privacyOut}>
        <ListRow
          testID={`${ids.privacyOut}.apple-health`}
          label={t('privacy.outAppleHealth')}
          description={t('privacy.outAppleHealthDescription')}
          value={healthConnected ? t('privacy.statusActive') : t('privacy.statusDisconnected')}
          valueColor={healthConnected ? 'brandText' : 'text2'}
        />
        <ListRow
          testID={`${ids.privacyOut}.backup`}
          label={t('privacy.outBackup')}
          description={t('privacy.outBackupDescription')}
          value={t('privacy.statusActive')}
          valueColor="brandText"
        />
        <ListRow
          testID={`${ids.privacyOut}.google-health`}
          label={t('privacy.outGoogle')}
          description={t('privacy.outGoogleDescription')}
          value={t('privacy.statusValidating')}
          valueColor="warnText"
          last
        />
      </ListGroup>

      <Text variant="secondarySemibold">{t('privacy.dataSection')}</Text>
      <ListGroup testID={ids.privacyActions}>
        {actions.map((action, i) => (
          <ListRow
            key={action.key}
            testID={`${ids.privacyActions}.${action.key}`}
            label={armed === action.key ? t('privacy.confirmAgain') : action.label}
            labelColor={action.key === 'export' ? 'text' : 'danger'}
            description={action.description}
            last={i === actions.length - 1}
            onPress={() => press(action.key)}
          />
        ))}
      </ListGroup>
      <Text variant="caption" color="text2">
        {t('privacy.footnote')}
      </Text>
    </Screen>
  );
}

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  HStack,
  ListGroup,
  ListRow,
  Screen,
  Stepper,
  Switch,
  Text,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useUpdateSettings } from '../api/useAccountActions';
import { AccountGate } from '../components/AccountGate';
import { NOTIFICATION_GROUPS, REMINDER_HOUR } from '../model/profile.mock';
import { useProfileStore } from '../model/profile.store';
import { profileIds as ids } from '../profile.testids';

import type { NotificationKey } from '../model/profile.types';
import type { Account } from '@/shared/api';

const formatHour = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const systemAllowed = useProfileStore((s) => s.systemNotificationsAllowed);
  const allowSystemNotifications = useProfileStore((s) => s.allowSystemNotifications);

  const allow = () => {
    allowSystemNotifications();
    showToast(t('notifications.allowedToast'));
  };

  return (
    <Screen
      testID={ids.notificationsScreen}
      header={
        <BackHeader
          testID={ids.notificationsBack}
          label={t('nav.backToProfile')}
          onPress={() => router.back()}
          trailing={
            <Button
              testID={ids.notificationsDone}
              label={t('nav.done')}
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
            />
          }
        />
      }
    >
      <Text variant="overlayTitle">{t('notifications.title')}</Text>
      {!systemAllowed ? (
        <Card
          testID={ids.notificationsSystemOff}
          variant="warn"
          radius="md"
          padding="md"
          gap="none"
        >
          <HStack gap="sm" justify="space-between">
            <Box style={styles.grow}>
              <Text variant="secondary" color="warnText">
                {t('notifications.systemOff')}
              </Text>
            </Box>
            <Button
              testID={ids.notificationsAllow}
              label={t('notifications.allow')}
              variant="ghost"
              size="xs"
              onPress={allow}
            />
          </HStack>
        </Card>
      ) : null}

      <AccountGate testID={ids.notificationsScreen}>
        {(account) => <NotificationSettings account={account} />}
      </AccountGate>
      <Text variant="caption" color="text2">
        {t('notifications.footnote')}
      </Text>
    </Screen>
  );
}

/** Switches and reminder hour, saved to the account on every change (optimistic). */
function NotificationSettings({ account }: { account: Account }) {
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const updateSettings = useUpdateSettings();
  const { notifications, reminderMinutes } = account.settings;
  const onError = () => showToast(t('state.saveFailed'));

  const toggleNotification = (key: NotificationKey) =>
    updateSettings.mutate({ notifications: { [key]: !notifications[key] } }, { onError });
  const adjustReminder = (direction: 1 | -1) => {
    const value = Math.min(
      REMINDER_HOUR.max,
      Math.max(REMINDER_HOUR.min, reminderMinutes + direction * REMINDER_HOUR.step),
    );
    if (value !== reminderMinutes) updateSettings.mutate({ reminderMinutes: value }, { onError });
  };

  return (
    <>
      <VStack testID={ids.notificationsRows} gap="md">
        {NOTIFICATION_GROUPS.map((group) => (
          <VStack key={group.key} gap="sm">
            <Text variant="secondarySemibold">{t(`notifications.groups.${group.key}`)}</Text>
            <ListGroup testID={`${ids.notificationsRows}.${group.key}`}>
              {group.rows.map((key, i) => (
                <ListRow
                  key={key}
                  testID={`${ids.notificationsRows}.${key}`}
                  label={t(`notifications.rows.${key}.title`)}
                  description={t(`notifications.rows.${key}.description`)}
                  last={i === group.rows.length - 1}
                  trailing={
                    <Switch
                      testID={`${ids.notificationsRows}.${key}.switch`}
                      value={notifications[key]}
                      onValueChange={() => toggleNotification(key)}
                      accessibilityLabel={t(`notifications.rows.${key}.title`)}
                    />
                  }
                />
              ))}
            </ListGroup>
          </VStack>
        ))}
      </VStack>

      {notifications.remind ? (
        <Card radius="md" padding="sm" gap="xxs">
          <Text variant="micro" color="text2" align="center">
            {t('notifications.reminderHour')}
          </Text>
          <Box align="center">
            <Stepper
              testID={ids.notificationsHour}
              valueLabel={formatHour(reminderMinutes)}
              onDecrement={() => adjustReminder(-1)}
              onIncrement={() => adjustReminder(1)}
              decrementLabel={t('notifications.earlier')}
              incrementLabel={t('notifications.later')}
            />
          </Box>
        </Card>
      ) : null}
    </>
  );
}

const styles = { grow: { flex: 1 } as const };

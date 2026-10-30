import { useRouter } from 'expo-router';

import {
  Box,
  Card,
  Divider,
  HStack,
  ListGroup,
  ListRow,
  Screen,
  SectionLabel,
  Text,
  VStack,
} from '@tracta/design-system';

import { useHealthConnection } from '@/features/health';
import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';
import { useAccount } from '@/shared/session';

import { useSignOut, useUpdateSettings } from '../api/useAccountActions';
import { AccountGate } from '../components/AccountGate';
import { ActionButton } from '../components/ActionButton';
import { ProfileHeader } from '../components/ProfileHeader';
import { toGoalValues, useGoalLabels } from '../hooks/useGoalLabels';
import { GOAL_KEYS, NOTIFICATION_COUNTED } from '../model/profile.mock';
import { profileRoutes } from '../model/profile.routes';
import { profileIds as ids } from '../profile.testids';

import type { Visibility } from '../model/profile.types';
import type { Account } from '@/shared/api';

const VISIBILITY_ORDER: readonly Visibility[] = ['friends', 'me', 'all'];

const VISIBILITY_COPY: Record<
  Visibility,
  {
    label: 'prefs.visibilityFriends' | 'prefs.visibilityMe' | 'prefs.visibilityAll';
    description:
      | 'prefs.visibilityFriendsDescription'
      | 'prefs.visibilityMeDescription'
      | 'prefs.visibilityAllDescription';
  }
> = {
  friends: { label: 'prefs.visibilityFriends', description: 'prefs.visibilityFriendsDescription' },
  me: { label: 'prefs.visibilityMe', description: 'prefs.visibilityMeDescription' },
  all: { label: 'prefs.visibilityAll', description: 'prefs.visibilityAllDescription' },
};

export function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { data } = useAccount();

  return (
    <Screen
      testID={ids.screen}
      bottomInset="tab"
      header={
        data ? (
          <ProfileHeader
            name={data.profile.name}
            subtitle={t('header.subtitle', { email: data.profile.email })}
            editLabel={t('header.edit')}
            onEdit={() => router.push(profileRoutes.edit)}
          />
        ) : undefined
      }
    >
      <AccountGate testID={ids.screen}>
        {(account) => <ProfileBody account={account} />}
      </AccountGate>
    </Screen>
  );
}

function ProfileBody({ account }: { account: Account }) {
  const source = useHealthConnection().data?.source ?? null;
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const updateSettings = useUpdateSettings();
  const signOut = useSignOut();
  const { settings } = account;
  const goalLabels = useGoalLabels(toGoalValues(account.goals));

  const notificationsOn = NOTIFICATION_COUNTED.filter((k) => settings.notifications[k]).length;
  const notificationsSummary = notificationsOn
    ? t('prefs.notificationsCount', { count: notificationsOn })
    : t('prefs.notificationsOff');

  const save = (patch: Parameters<typeof updateSettings.mutate>[0], toast?: string) =>
    updateSettings.mutate(patch, {
      onSuccess: () => {
        if (toast) showToast(toast);
      },
      onError: () => showToast(t('state.saveFailed')),
    });

  const onCycleVisibility = () => {
    const current = settings.visibility;
    const next =
      VISIBILITY_ORDER[(VISIBILITY_ORDER.indexOf(current) + 1) % VISIBILITY_ORDER.length] ??
      current;
    save({ visibility: next });
    showToast(t('prefs.visibilityToast', { value: t(VISIBILITY_COPY[next].label) }));
  };

  // mutateAsync: signing out unmounts this screen (session gate), which would drop mutate callbacks.
  const logout = async () => {
    try {
      await signOut.mutateAsync();
    } catch {
      showToast(t('state.saveFailed'));
      return;
    }
    showToast(t('actions.loggedOut'));
    router.replace(profileRoutes.welcome);
  };

  return (
    <>
      <SectionLabel>{t('goals.section')}</SectionLabel>
      <ListGroup testID={ids.goalsGroup}>
        {GOAL_KEYS.map((key, i) => (
          <ListRow
            key={key}
            testID={`${ids.goalsGroup}.${key}`}
            label={key === 'sleep' ? t('goals.sleepShort') : t(`goals.${key}.name`)}
            value={goalLabels[key].short}
            chevron
            last={i === GOAL_KEYS.length - 1}
            onPress={() => router.push(profileRoutes.goals)}
          />
        ))}
      </ListGroup>

      <SectionLabel>{t('sources.section')}</SectionLabel>
      <Card testID={ids.sourcesCard} padding="xl" py="lg" gap="ml">
        <VStack gap="xs">
          <HStack justify="space-between">
            <Text variant="cardTitleSm">{t('sources.appleHealth')}</Text>
            <Text
              testID={ids.sourcesAppleStatus}
              variant="captionSemibold"
              color={source === 'apple_health' ? 'success' : 'text2'}
            >
              {source === 'apple_health' ? t('sources.appleStatus') : t('sources.appleStatusOff')}
            </Text>
          </HStack>
          <Text variant="secondary" color="text2">
            {t('sources.appleDescription')}
          </Text>
        </VStack>
        <Divider />
        <VStack gap="xs">
          <HStack justify="space-between">
            <Text variant="cardTitleSm">{t('sources.googleHealth')}</Text>
            <Text
              variant="captionSemibold"
              color={source === 'health_connect' ? 'success' : 'warnText'}
            >
              {source === 'health_connect'
                ? t('sources.healthConnectStatus')
                : t('sources.googleStatus')}
            </Text>
          </HStack>
          <Text variant="secondary" color="text2">
            {t('sources.googleDescription')}
          </Text>
        </VStack>
        <Divider />
        <VStack gap="xs">
          <HStack justify="space-between">
            <Text variant="cardTitleSm">{t('sources.miBand')}</Text>
            <Text variant="caption" color="text2">
              {t('sources.miBandStatus')}
            </Text>
          </HStack>
          <Text variant="secondary" color="text2">
            {t('sources.miBandDescription')}
          </Text>
        </VStack>
      </Card>

      <HStack gap="sm" align="stretch">
        <Box flex={1}>
          <ActionButton
            testID={ids.achievements}
            label={t('actions.achievements')}
            onPress={() => router.push(profileRoutes.achievements)}
          />
        </Box>
        <Box flex={1}>
          <ActionButton
            testID={ids.photos}
            label={t('actions.photos')}
            onPress={() => router.push(profileRoutes.photos)}
          />
        </Box>
      </HStack>
      <ActionButton
        testID={ids.social}
        label={t('actions.social')}
        onPress={() => router.push(profileRoutes.social)}
      />
      <ActionButton
        testID={ids.tour}
        label={t('actions.tour')}
        onPress={() => router.push(profileRoutes.tour)}
      />
      <ActionButton
        testID={ids.connections}
        label={t('actions.connections')}
        onPress={() => router.push(profileRoutes.connections)}
      />

      <SectionLabel>{t('prefs.section')}</SectionLabel>
      <ListGroup>
        <ListRow
          testID={ids.prefUnits}
          label={t('prefs.units')}
          value={settings.units === 'kg' ? t('prefs.unitsValue') : t('prefs.unitsValueLb')}
          onPress={() => save({ units: settings.units === 'kg' ? 'lb' : 'kg' })}
        />
        <ListRow
          testID={ids.prefAutoRest}
          label={t('prefs.autoRest')}
          value={settings.autoRest ? t('prefs.autoRestOn') : t('prefs.autoRestOff')}
          onPress={() => save({ autoRest: !settings.autoRest })}
        />
        <ListRow
          testID={ids.prefNotifications}
          label={t('prefs.notifications')}
          value={notificationsSummary}
          chevron
          onPress={() => router.push(profileRoutes.notifications)}
        />
        <ListRow
          testID={ids.prefVisibility}
          label={t('prefs.visibility')}
          description={t(VISIBILITY_COPY[settings.visibility].description)}
          value={t(VISIBILITY_COPY[settings.visibility].label)}
          chevron
          onPress={onCycleVisibility}
        />
        <ListRow
          testID={ids.prefPrivacy}
          label={t('prefs.privacy')}
          chevron
          onPress={() => router.push(profileRoutes.privacy)}
        />
        <ListRow
          testID={ids.prefAppSettings}
          label={t('prefs.appSettings')}
          chevron
          last
          onPress={() => router.push(profileRoutes.appSettings)}
        />
      </ListGroup>

      <Text variant="caption" color="text2">
        {t('footnote')}
      </Text>
      <ActionButton
        testID={ids.logout}
        label={t('actions.logout')}
        tone="danger"
        onPress={() => void logout()}
      />
    </>
  );
}

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
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

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { ActionButton } from '../components/ActionButton';
import { ProfileHeader } from '../components/ProfileHeader';
import { useGoalLabels } from '../hooks/useGoalLabels';
import { GOAL_KEYS, NOTIFICATION_COUNTED } from '../model/profile.mock';
import { profileRoutes } from '../model/profile.routes';
import { useProfileStore } from '../model/profile.store';
import { profileIds as ids } from '../profile.testids';

import type { Visibility } from '../model/profile.types';

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
  const showToast = useFeedbackStore((s) => s.showToast);
  const account = useProfileStore((s) => s.account);
  const pro = useProfileStore((s) => s.pro);
  const visibility = useProfileStore((s) => s.visibility);
  const cycleVisibility = useProfileStore((s) => s.cycleVisibility);
  const notifications = useProfileStore((s) => s.notifications);
  const goalLabels = useGoalLabels();

  const isPro = pro.active;
  const planPrice = pro.plan === 'year' ? t('paywall.yearPrice') : t('paywall.monthPrice');
  const proDescription = !isPro
    ? t('pro.freeDescription')
    : pro.cancelled
      ? t('pro.cancelledDescription')
      : pro.trial
        ? t('pro.trialDescription', {
            price: planPrice + (pro.plan === 'year' ? t('pro.perYear') : t('pro.perMonth')),
          })
        : t('pro.activeDescription', {
            plan: (pro.plan === 'year'
              ? t('paywall.yearName')
              : t('paywall.monthName')
            ).toLowerCase(),
          });
  const openPro = () => router.push(isPro ? profileRoutes.manage : profileRoutes.paywall());

  const notificationsOn = NOTIFICATION_COUNTED.filter((k) => notifications[k]).length;
  const notificationsSummary = notificationsOn
    ? t('prefs.notificationsCount', { count: notificationsOn })
    : t('prefs.notificationsOff');

  const onCycleVisibility = () => {
    const next = cycleVisibility();
    showToast(t('prefs.visibilityToast', { value: t(VISIBILITY_COPY[next].label) }));
  };

  const logout = () => {
    showToast(t('actions.loggedOut'));
    router.replace(profileRoutes.welcome);
  };

  return (
    <Screen
      testID={ids.screen}
      bottomInset="tab"
      header={
        <ProfileHeader
          name={account.name}
          subtitle={t('header.subtitle', { email: account.email })}
          editLabel={t('header.edit')}
          onEdit={() => router.push(profileRoutes.edit)}
        />
      }
    >
      <Card
        testID={ids.proCard}
        variant={isPro ? 'ink' : 'surface'}
        padding="xl"
        py="lg"
        onPress={openPro}
        accessibilityLabel={t('pro.title')}
      >
        <HStack gap="md" justify="space-between">
          <VStack flex={1} gap="xxs">
            <Text testID={ids.proTitle} variant="subtitle" color={isPro ? 'textOnInk' : 'text'}>
              {t('pro.title')}
            </Text>
            <Text
              testID={ids.proDescription}
              variant="secondary"
              color={isPro ? 'text2OnInk' : 'text2'}
            >
              {proDescription}
            </Text>
          </VStack>
          <Button
            testID={ids.proCta}
            label={isPro ? t('pro.manage') : t('pro.seePlans')}
            variant={isPro ? 'onInk' : 'primary'}
            size="xs"
            onPress={openPro}
          />
        </HStack>
      </Card>

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
            <Text variant="captionSemibold" color="success">
              {t('sources.appleStatus')}
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
            <Text variant="captionSemibold" color="warnText">
              {t('sources.googleStatus')}
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
        <ListRow testID={ids.prefUnits} label={t('prefs.units')} value={t('prefs.unitsValue')} />
        <ListRow
          testID={ids.prefAutoRest}
          label={t('prefs.autoRest')}
          value={t('prefs.autoRestOn')}
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
          description={t(VISIBILITY_COPY[visibility].description)}
          value={t(VISIBILITY_COPY[visibility].label)}
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
        onPress={logout}
      />
    </Screen>
  );
}

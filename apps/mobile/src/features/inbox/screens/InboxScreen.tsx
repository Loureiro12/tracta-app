import { useRouter } from 'expo-router';

import {
  BackHeader,
  Button,
  Card,
  HStack,
  Screen,
  SectionLabel,
  Text,
  VStack,
} from '@tracta/design-system';

import { today, toDateKey } from '@/shared/clock';
import { useFeedbackStore } from '@/shared/feedback';
import { formatDate, useTranslation } from '@/shared/i18n';

import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useRemoveNotification,
} from '../api/useNotifications';
import { InboxItemRow } from '../components/InboxItemRow';
import { inboxIds } from '../inbox.testids';
import { groupOf, inboxGroups } from '../model/inbox.presentation';
import { useInboxStore } from '../model/inbox.store';

import type { notifications } from '@tracta/api';
import type { Href } from 'expo-router';

const TIME_FMT = { hour: '2-digit', minute: '2-digit' } as const;
const DAY_TIME_FMT = { weekday: 'short', hour: '2-digit', minute: '2-digit' } as const;
const DATE_FMT = { day: 'numeric', month: 'short' } as const;

/** Notification center overlay: grouped list, mark-as-read, remove and the empty state. */
export function InboxScreen() {
  const router = useRouter();
  const { t } = useTranslation('inbox');
  const showToast = useFeedbackStore((s) => s.showToast);
  const systemOff = useInboxStore((s) => s.systemNotificationsOff);
  const query = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const remove = useRemoveNotification();

  const live = query.data ?? [];
  const hasUnread = live.some((item) => item.readAt === null);
  const todayKey = today();
  const onError = () => showToast(t('actionError'));

  const grouped = live.map((item) => {
    const created = new Date(item.createdAt);
    const group = groupOf(created, todayKey, toDateKey);
    const time = formatDate(
      created,
      group === 'today' ? TIME_FMT : group === 'week' ? DAY_TIME_FMT : DATE_FMT,
    );
    return { item, group, time };
  });

  const open = (item: notifications.Notification) => {
    if (item.readAt === null) markRead.mutate(item.id, { onError });
    if (item.href) router.push(item.href as Href);
  };

  return (
    <Screen
      testID={inboxIds.screen}
      header={
        <BackHeader
          testID={inboxIds.back}
          label={t('back')}
          onPress={() => router.back()}
          trailing={
            hasUnread ? (
              <Button
                testID={inboxIds.readAll}
                label={t('readAll')}
                variant="ghost"
                size="sm"
                onPress={() => markAllRead.mutate(undefined, { onError })}
              />
            ) : null
          }
        />
      }
    >
      <Text testID={inboxIds.title} variant="overlayTitle">
        {t('title')}
      </Text>

      {systemOff ? (
        <Card testID={inboxIds.systemOff} variant="warn" radius="xl" px="lg" py="ml">
          <HStack gap="md" justify="space-between">
            <VStack flex={1}>
              <Text variant="secondary" color="warnText">
                {t('systemOff.text')}
              </Text>
            </VStack>
            <Button
              testID={inboxIds.systemOffCta}
              label={t('systemOff.cta')}
              variant="surface"
              size="xs"
              onPress={() => router.push('/profile/notifications')}
            />
          </HStack>
        </Card>
      ) : null}

      {query.isError ? (
        <Card testID={`${inboxIds.items}.error`} variant="warn" radius="xl" px="lg" py="ml">
          <HStack gap="md" justify="space-between">
            <VStack flex={1}>
              <Text variant="secondary" color="warnText">
                {t('loadError.text')}
              </Text>
            </VStack>
            <Button
              testID={`${inboxIds.items}.error.retry`}
              label={t('loadError.retry')}
              variant="surface"
              size="xs"
              onPress={() => void query.refetch()}
            />
          </HStack>
        </Card>
      ) : null}

      {query.isSuccess && live.length === 0 ? (
        <VStack testID={inboxIds.empty} align="center" gap="xs" py="5xl" px="screen">
          <Text testID={`${inboxIds.empty}.title`} variant="subtitle" align="center">
            {t('empty.title')}
          </Text>
          <Text variant="secondary" color="text2" align="center">
            {t('empty.description')}
          </Text>
        </VStack>
      ) : null}

      <VStack testID={inboxIds.items} gap="md">
        {inboxGroups.map((group) => {
          const items = grouped.filter((row) => row.group === group);
          if (items.length === 0) return null;
          return (
            <VStack key={group} gap="sm" pt="xs">
              <SectionLabel testID={`${inboxIds.items}.${group}.label`}>
                {t(`groups.${group}`)}
              </SectionLabel>
              <Card testID={`${inboxIds.items}.${group}`} padding="none" py="xxs" gap="none">
                {items.map(({ item, time }, i) => (
                  <InboxItemRow
                    key={item.id}
                    item={item}
                    time={time}
                    read={item.readAt !== null}
                    last={i === items.length - 1}
                    onOpen={() => open(item)}
                    onRemove={() => remove.mutate(item.id, { onError })}
                  />
                ))}
              </Card>
            </VStack>
          );
        })}
      </VStack>
    </Screen>
  );
}

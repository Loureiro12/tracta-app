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

import { useTranslation } from '@/shared/i18n';

import { InboxItemRow } from '../components/InboxItemRow';
import { inboxIds } from '../inbox.testids';
import { inboxGroups, inboxItems } from '../model/inbox.mock';
import { useInboxStore } from '../model/inbox.store';

import type { InboxItem } from '../model/inbox.mock';

/** Notification center overlay: grouped list, mark-as-read, remove and the empty state. */
export function InboxScreen() {
  const router = useRouter();
  const { t } = useTranslation('inbox');
  const read = useInboxStore((s) => s.read);
  const removed = useInboxStore((s) => s.removed);
  const systemOff = useInboxStore((s) => s.systemNotificationsOff);
  const markRead = useInboxStore((s) => s.markRead);
  const markAllRead = useInboxStore((s) => s.markAllRead);
  const remove = useInboxStore((s) => s.remove);

  const live = inboxItems.filter((item) => !removed.includes(item.id));
  const hasUnread = live.some((item) => !read.includes(item.id));

  const open = (item: InboxItem) => {
    markRead(item.id);
    router.push(item.href);
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
                onPress={markAllRead}
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

      {live.length === 0 ? (
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
          const items = live.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <VStack key={group} gap="sm" pt="xs">
              <SectionLabel testID={`${inboxIds.items}.${group}.label`}>
                {t(`groups.${group}`)}
              </SectionLabel>
              <Card testID={`${inboxIds.items}.${group}`} padding="none" py="xxs" gap="none">
                {items.map((item, i) => (
                  <InboxItemRow
                    key={item.id}
                    item={item}
                    read={read.includes(item.id)}
                    last={i === items.length - 1}
                    onOpen={() => open(item)}
                    onRemove={() => remove(item.id)}
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

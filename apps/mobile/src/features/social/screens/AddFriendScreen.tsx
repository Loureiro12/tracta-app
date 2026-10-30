import { useRouter } from 'expo-router';

import { BackHeader, Button, Screen, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useProfileByHandle } from '../api/useAddFriend';
import { useSendInvite } from '../api/useInvite';
import { PeopleCard } from '../components/PeopleCard';
import { PersonRow } from '../components/PersonRow';
import { avatarColor } from '../model/social.constants';
import { firstName } from '../model/social.ranking';
import { socialRoutes } from '../model/social.routes';
import { socialIds } from '../social.testids';

type Props = { handle: string };

/** Invite link landing (tracta://social/add/<handle>): shows who invited and adds them. */
export function AddFriendScreen({ handle }: Props) {
  const router = useRouter();
  const { t } = useTranslation('social');
  const showToast = useFeedbackStore((s) => s.showToast);
  const profile = useProfileByHandle(handle);
  const sendInvite = useSendInvite();
  const person = profile.data ?? null;
  const notFound = profile.isError || (profile.isSuccess && !person);

  const leave = () => (router.canGoBack() ? router.back() : router.replace(socialRoutes.hub));

  const onAdd = () => {
    if (!person?.handle) return;
    sendInvite.mutate(person.handle, {
      onSuccess: (result) => {
        showToast(
          result.status === 'accepted'
            ? t('hub.accepted', { name: firstName(person.name) })
            : t('invite.sentTo', { name: firstName(person.name) }),
        );
        router.replace(socialRoutes.hub);
      },
      onError: () => showToast(t('actionError')),
    });
  };

  return (
    <Screen
      testID={socialIds.addScreen}
      header={<BackHeader testID={socialIds.addBack} label={t('hub.back')} onPress={leave} />}
    >
      <VStack gap="xs">
        <Text variant="overlayTitle">{t('add.title')}</Text>
        <Text color="text2">{t('add.subtitle')}</Text>
      </VStack>

      {person ? (
        <VStack gap="md">
          <PeopleCard>
            <PersonRow
              testID={socialIds.addPerson}
              name={person.name}
              color={avatarColor(person.id)}
              subtitle={`@${person.handle ?? handle}`}
              last
            />
          </PeopleCard>
          <Button
            testID={socialIds.addSend}
            label={t('add.send', { name: firstName(person.name) })}
            size="lg"
            fullWidth
            loading={sendInvite.isPending}
            onPress={onAdd}
          />
        </VStack>
      ) : null}

      {notFound ? (
        <Text testID={socialIds.addNotFound} variant="secondary" color="text2">
          {t('add.notFound')}
        </Text>
      ) : null}

      <Text variant="caption" color="text2">
        {t('invite.note')}
      </Text>
    </Screen>
  );
}

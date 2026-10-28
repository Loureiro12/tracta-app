import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Box, Button, Card, HStack, Screen, Text, TextField, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { PeopleCard } from '../components/PeopleCard';
import { PersonRow } from '../components/PersonRow';
import { SheetHeader } from '../components/SheetHeader';
import { friends as allFriends, inviteLink, shareTargets } from '../model/social.mock';
import { firstName } from '../model/social.ranking';
import { useSocialStore } from '../model/social.store';
import { socialIds } from '../social.testids';

const HANDLE_RE = /^@[\w.]{3,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Invite friends: shareable link, invite by handle/e-mail and contacts already on Tracta. */
export function InviteScreen() {
  const router = useRouter();
  const { t } = useTranslation('social');
  const showToast = useFeedbackStore((s) => s.showToast);
  const friendIds = useSocialStore((s) => s.friendIds);
  const pendingInvites = useSocialStore((s) => s.pendingInvites);
  const linkCopied = useSocialStore((s) => s.linkCopied);
  const copyLink = useSocialStore((s) => s.copyLink);
  const invite = useSocialStore((s) => s.invite);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const contacts = allFriends.filter((f) => !friendIds.includes(f.id));
  const allInvited = contacts.every((c) => pendingInvites.includes(c.id));

  const onSend = () => {
    const q = query.trim();
    if (!HANDLE_RE.test(q) && !EMAIL_RE.test(q)) {
      setError(t('invite.error'));
      return;
    }
    const known = allFriends.find((f) => f.handle === q.toLowerCase());
    invite(known ? known.id : q);
    setQuery('');
    setError(undefined);
    showToast(t('invite.sent'));
  };

  return (
    <Screen
      testID={socialIds.inviteScreen}
      header={
        <SheetHeader
          testID={socialIds.inviteClose}
          title={t('invite.title')}
          closeLabel={t('invite.close')}
          onClose={() => router.back()}
        />
      }
    >
      <Card radius="pill" padding="lg" px="xl" gap="sm">
        <Text variant="caption" color="text2">
          {t('invite.linkLabel')}
        </Text>
        <HStack justify="space-between" gap="sm">
          <Box flex={1}>
            <Text testID={socialIds.inviteLink} variant="cardTitleSm" numberOfLines={1}>
              {inviteLink}
            </Text>
          </Box>
          <Button
            testID={socialIds.inviteCopy}
            label={linkCopied ? t('invite.copied') : t('invite.copy')}
            size="xs"
            onPress={() => {
              copyLink();
              showToast(t('invite.linkCopied'));
            }}
          />
        </HStack>
      </Card>

      <HStack testID={socialIds.inviteShare} gap="sm">
        {shareTargets.map((target) => (
          <Box key={target} flex={1}>
            <Button
              testID={`${socialIds.inviteShare}.${target}`}
              label={t(`invite.share.${target}`)}
              variant="onInk"
              size="sm"
              shape="rounded"
              fullWidth
              onPress={() =>
                showToast(t('invite.opening', { target: t(`invite.share.${target}`) }))
              }
            />
          </Box>
        ))}
      </HStack>

      <Text variant="secondarySemibold">{t('invite.byHandle')}</Text>
      <HStack gap="sm" align="flex-start">
        <Box flex={1}>
          <TextField
            testID={socialIds.inviteQuery}
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              setError(undefined);
            }}
            placeholder={t('invite.placeholder')}
            {...(error ? { errorText: error } : {})}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onSubmitEditing={onSend}
          />
        </Box>
        <Button testID={socialIds.inviteSend} label={t('invite.send')} onPress={onSend} />
      </HStack>

      <Text variant="secondarySemibold">{t('invite.contacts')}</Text>
      <PeopleCard testID={socialIds.contacts}>
        {contacts.map((c, i) => {
          const sent = pendingInvites.includes(c.id);
          return (
            <PersonRow
              key={c.id}
              testID={`${socialIds.contacts}.${c.id}`}
              name={c.name}
              color={c.color}
              subtitle={c.handle}
              minHeight={62}
              last={i === contacts.length - 1 && !allInvited}
              trailing={
                <Button
                  testID={`${socialIds.contacts}.${c.id}.button`}
                  label={sent ? t('invite.contactSent') : t('invite.contactInvite')}
                  variant={sent ? 'secondary' : 'primary'}
                  size="xs"
                  onPress={() => {
                    if (sent) return;
                    invite(c.id);
                    showToast(t('invite.sentTo', { name: firstName(c.name) }));
                  }}
                />
              }
            />
          );
        })}
        {allInvited ? (
          <VStack py="lg">
            <Text testID={socialIds.noContacts} variant="secondary" color="text2">
              {t('invite.noContacts')}
            </Text>
          </VStack>
        ) : null}
      </PeopleCard>

      <Text variant="caption" color="text2">
        {t('invite.note')}
      </Text>
    </Screen>
  );
}

import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Box, Button, Card, HStack, Screen, Text, TextField, VStack } from '@tracta/design-system';

import { ApiError } from '@/shared/api';
import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';
import { useAccount } from '@/shared/session';

import { useSendInvite, useSuggestions } from '../api/useInvite';
import { PeopleCard } from '../components/PeopleCard';
import { PersonRow } from '../components/PersonRow';
import { SheetHeader } from '../components/SheetHeader';
import { INVITE_LINK_BASE, avatarColor, shareTargets } from '../model/social.constants';
import { firstName } from '../model/social.ranking';
import { useSocialStore } from '../model/social.store';
import { socialIds } from '../social.testids';

const HANDLE_RE = /^@[\w.]{3,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Invite friends: shareable link, invite by handle/e-mail and friends of friends on Tracta. */
export function InviteScreen() {
  const router = useRouter();
  const { t } = useTranslation('social');
  const showToast = useFeedbackStore((s) => s.showToast);
  const account = useAccount();
  const suggestions = useSuggestions();
  const sendInvite = useSendInvite();
  const inviteEmail = useSocialStore((s) => s.inviteEmail);
  const [linkCopied, setLinkCopied] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const inviteLink = `${INVITE_LINK_BASE}${account.data?.profile.handle ?? ''}`;
  const contacts = (suggestions.data ?? []).filter((c) => c.handle);
  const allInvited = suggestions.isSuccess && contacts.every((c) => c.invited);

  const onSend = () => {
    const q = query.trim();
    if (!HANDLE_RE.test(q) && !EMAIL_RE.test(q)) {
      setError(t('invite.error'));
      return;
    }
    if (!q.startsWith('@')) {
      inviteEmail(q);
      setQuery('');
      setError(undefined);
      showToast(t('invite.sent'));
      return;
    }
    sendInvite.mutate(q, {
      onSuccess: () => {
        setQuery('');
        setError(undefined);
        showToast(t('invite.sent'));
      },
      onError: (e) => {
        if (e instanceof ApiError && (e.code === 'not_found' || e.code === 'validation'))
          setError(t('invite.notFound'));
        else showToast(t('actionError'));
      },
    });
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
              setLinkCopied(true);
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
          const sent = c.invited;
          const key = c.handle ?? c.id;
          return (
            <PersonRow
              key={c.id}
              testID={`${socialIds.contacts}.${key}`}
              name={c.name}
              color={avatarColor(c.id)}
              subtitle={`@${c.handle ?? ''}`}
              minHeight={62}
              last={i === contacts.length - 1 && !allInvited}
              trailing={
                <Button
                  testID={`${socialIds.contacts}.${key}.button`}
                  label={sent ? t('invite.contactSent') : t('invite.contactInvite')}
                  variant={sent ? 'secondary' : 'primary'}
                  size="xs"
                  onPress={() => {
                    if (sent || !c.handle) return;
                    sendInvite.mutate(c.handle, {
                      onSuccess: () => showToast(t('invite.sentTo', { name: firstName(c.name) })),
                      onError: () => showToast(t('actionError')),
                    });
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

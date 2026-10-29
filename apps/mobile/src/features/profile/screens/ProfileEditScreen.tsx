import { useState } from 'react';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Button,
  CheckCircle,
  Divider,
  HStack,
  Screen,
  Text,
  TextField,
  VStack,
} from '@tracta/design-system';

import { ApiError } from '@/shared/api';
import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useChangePassword, useUpdateEmail, useUpdateProfile } from '../api/useAccountActions';
import { AccountGate } from '../components/AccountGate';
import { profileIds as ids } from '../profile.testids';

import type { Account } from '@/shared/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = {
  name?: string | undefined;
  email?: string | undefined;
  current?: string | undefined;
  next?: string | undefined;
};

/** Password rules from the handoff: length ≥ 8, one digit, one uppercase letter. */
function passwordRules(pw: string) {
  return [
    { key: 'ruleLength', ok: pw.length >= 8 },
    { key: 'ruleNumber', ok: /\d/.test(pw) },
    { key: 'ruleUpper', ok: /[A-Z]/.test(pw) },
  ] as const;
}

export function ProfileEditScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  return (
    <Screen
      testID={ids.editScreen}
      header={
        <BackHeader
          testID={ids.editBack}
          label={t('nav.backToProfile')}
          onPress={() => router.back()}
        />
      }
    >
      <AccountGate testID={ids.editScreen}>
        {(account) => <ProfileEditForm account={account} />}
      </AccountGate>
    </Screen>
  );
}

const codeOf = (error: unknown) => (error instanceof ApiError ? error.code : 'unknown');

function ProfileEditForm({ account }: { account: Account }) {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const updateProfile = useUpdateProfile();
  const updateEmail = useUpdateEmail();
  const changePasswordMutation = useChangePassword();

  const [name, setName] = useState(account.profile.name);
  const [email, setEmail] = useState(account.profile.email);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const saving = updateProfile.isPending || updateEmail.isPending;

  const rules = passwordRules(next);

  const save = async () => {
    const e: Errors = {};
    if (!name.trim()) e.name = t('edit.errorName');
    if (!EMAIL_RE.test(email.trim())) e.email = t('edit.errorEmail');
    setErrors((prev) => ({ ...prev, name: e.name, email: e.email }));
    if (e.name || e.email || saving) return;
    const nextEmail = email.trim().toLowerCase();
    const emailChanged = nextEmail !== account.profile.email.toLowerCase();
    try {
      if (name.trim() !== account.profile.name)
        await updateProfile.mutateAsync({ name: name.trim() });
      if (emailChanged) await updateEmail.mutateAsync(nextEmail);
    } catch (error) {
      const code = codeOf(error);
      if (code === 'email_taken')
        setErrors((prev) => ({ ...prev, email: t('edit.errorEmailTaken') }));
      else if (code === 'validation')
        setErrors((prev) => ({ ...prev, email: t('edit.errorEmail') }));
      else showToast(t('state.saveFailed'));
      return;
    }
    showToast(emailChanged ? t('edit.emailSentToast', { email: nextEmail }) : t('edit.savedToast'));
    router.back();
  };

  const changePassword = () => {
    const e: Errors = {};
    if (!current) e.current = t('edit.errorCurrentRequired');
    if (!rules.every((r) => r.ok)) e.next = t('edit.errorNewWeak');
    else if (next === current) e.next = t('edit.errorNewSame');
    setErrors((prev) => ({ ...prev, current: e.current, next: e.next }));
    if (e.current || e.next || changePasswordMutation.isPending) return;
    changePasswordMutation.mutate(
      { current, next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          showToast(t('edit.passwordToast'));
        },
        onError: (error) => {
          const code = codeOf(error);
          if (code === 'invalid_credentials')
            setErrors((prev) => ({ ...prev, current: t('edit.errorCurrentWrong') }));
          else if (code === 'weak_password')
            setErrors((prev) => ({ ...prev, next: t('edit.errorNewWeak') }));
          else showToast(t('state.saveFailed'));
        },
      },
    );
  };

  return (
    <>
      <Text variant="overlayTitle">{t('edit.title')}</Text>
      <TextField
        testID={ids.editName}
        label={t('edit.name')}
        placeholder={t('edit.namePlaceholder')}
        value={name}
        onChangeText={setName}
        {...(errors.name ? { errorText: errors.name } : {})}
        autoCapitalize="words"
      />
      <TextField
        testID={ids.editEmail}
        label={t('edit.email')}
        placeholder={t('edit.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        {...(errors.email ? { errorText: errors.email } : {})}
        helperText={t('edit.emailHint')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button
        testID={ids.editSave}
        label={t('edit.save')}
        size="lg"
        fullWidth
        onPress={() => void save()}
      />

      <Divider my="xs" />
      <Text variant="secondarySemibold">{t('edit.passwordSection')}</Text>
      <TextField
        testID={ids.editCurrentPassword}
        label={t('edit.currentPassword')}
        placeholder={t('edit.currentPassword')}
        value={current}
        onChangeText={setCurrent}
        {...(errors.current ? { errorText: errors.current } : {})}
        secureTextEntry
        // Keeps iOS from covering the field with the "Automatic Strong Password" suggestion.
        textContentType="oneTimeCode"
      />
      <TextField
        testID={ids.editNewPassword}
        label={t('edit.newPassword')}
        placeholder={t('edit.newPassword')}
        value={next}
        onChangeText={setNext}
        {...(errors.next ? { errorText: errors.next } : {})}
        secureTextEntry
        // Keeps iOS from covering the field with the "Automatic Strong Password" suggestion.
        textContentType="oneTimeCode"
      />
      <VStack testID={ids.editRules} gap="sm">
        {rules.map((rule) => (
          <HStack key={rule.key} gap="sm">
            <CheckCircle
              testID={`${ids.editRules}.${rule.key}.check`}
              checked={rule.ok}
              size={18}
            />
            <Text
              testID={`${ids.editRules}.${rule.key}`}
              variant="secondary"
              color={rule.ok ? 'text' : 'text2'}
            >
              {t(`edit.${rule.key}`)}
            </Text>
          </HStack>
        ))}
      </VStack>
      <Button
        testID={ids.editChangePassword}
        label={t('edit.changePassword')}
        variant="surface"
        size="lg"
        fullWidth
        onPress={changePassword}
      />
    </>
  );
}

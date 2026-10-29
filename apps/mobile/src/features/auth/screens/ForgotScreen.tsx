import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Button, Screen, TextField, VStack } from '@tracta/design-system';

import { ApiError } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';

import { usePasswordReset } from '../api/useAuthActions';
import { authIds } from '../auth.testids';
import { AuthBackButton } from '../components/AuthBackButton';
import { AuthTitle } from '../components/AuthTitle';
import { useAuthStore } from '../model/auth.store';
import { isEmailValid } from '../model/auth.validation';

export function ForgotScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const storedEmail = useAuthStore((s) => s.email);
  const setStoredEmail = useAuthStore((s) => s.setEmail);
  const reset = usePasswordReset();

  const [email, setEmail] = useState(storedEmail);
  const [error, setError] = useState<string | null>(null);
  const busy = reset.isPending;

  const submit = () => {
    if (!isEmailValid(email)) {
      setError(t('forgot.errors.email'));
      return;
    }
    setError(null);
    setStoredEmail(email.trim());
    reset.mutate(email.trim(), {
      onSuccess: () => router.push('/sent'),
      onError: (e) =>
        setError(
          e instanceof ApiError && e.code === 'network' ? t('errors.network') : t('errors.generic'),
        ),
    });
  };

  return (
    <Screen testID={authIds.forgotScreen} header={<AuthBackButton testID={authIds.forgotBack} />}>
      <VStack gap="xl" pt="xs">
        <AuthTitle
          testID={authIds.forgotTitle}
          title={t('forgot.title')}
          subtitle={t('forgot.subtitle')}
        />
        <TextField
          testID={authIds.forgotEmail}
          label={t('forgot.email')}
          placeholder={t('forgot.emailPlaceholder')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          {...(error ? { errorText: error } : {})}
        />
        <Button
          testID={authIds.forgotSubmit}
          label={t('forgot.submit')}
          size="lg"
          fullWidth
          loading={busy}
          onPress={submit}
        />
        <Button
          testID={authIds.forgotLogin}
          label={t('forgot.backToLogin')}
          variant="ghost"
          size="sm"
          fullWidth
          onPress={() => router.back()}
        />
      </VStack>
    </Screen>
  );
}

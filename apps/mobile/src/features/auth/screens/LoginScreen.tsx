import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Box, Button, Card, Screen, Text, TextField, VStack } from '@tracta/design-system';

import { ApiError } from '@/shared/api';
import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useSignIn, useSocialProviders, useSocialSignIn } from '../api/useAuthActions';
import { authIds } from '../auth.testids';
import { AuthBackButton } from '../components/AuthBackButton';
import { AuthFooterLink } from '../components/AuthFooterLink';
import { AuthTitle } from '../components/AuthTitle';
import { PasswordField } from '../components/PasswordField';
import { SocialButtons } from '../components/SocialButtons';
import { useAuthStore } from '../model/auth.store';
import { isEmailValid } from '../model/auth.validation';

import type { SocialProvider } from '../model/auth.mock';

type Errors = {
  email?: string | undefined;
  password?: string | undefined;
  general?: string | undefined;
};

export function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const showToast = useFeedbackStore((s) => s.showToast);
  const storedEmail = useAuthStore((s) => s.email);
  const setStoredEmail = useAuthStore((s) => s.setEmail);
  const signIn = useSignIn();
  const socialSignIn = useSocialSignIn();
  const providers = useSocialProviders();

  const [email, setEmail] = useState(storedEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const busy = signIn.isPending;

  const onChangeEmail = (value: string) => {
    setEmail(value);
    setErrors((e) => ({ ...e, email: undefined, general: undefined }));
  };
  const onChangePassword = (value: string) => {
    setPassword(value);
    setErrors((e) => ({ ...e, password: undefined, general: undefined }));
  };

  const submit = () => {
    const next: Errors = {};
    if (!isEmailValid(email)) next.email = t('login.errors.email');
    if (!password) next.password = t('login.errors.password');
    if (next.email || next.password) {
      setErrors(next);
      return;
    }
    setErrors({});
    setStoredEmail(email.trim());
    signIn.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          showToast(t('login.welcomeToast'));
          router.replace('/');
        },
        onError: (error) =>
          setErrors({
            general:
              error instanceof ApiError && error.code === 'network'
                ? t('errors.network')
                : t('login.errors.general'),
          }),
      },
    );
  };

  const social = (provider: SocialProvider) => {
    if (socialSignIn.isPending) return;
    socialSignIn.mutate(provider, {
      onSuccess: (user) => {
        if (!user) return;
        showToast(t('social.connectedToast', { provider }));
        // A first sign-in created the account: it goes through onboarding like a sign-up.
        if (user.isNew) router.replace({ pathname: '/connect', params: { mode: 'onboarding' } });
        else router.replace('/');
      },
      onError: (error) =>
        showToast(
          error instanceof ApiError && error.code === 'network'
            ? t('errors.network')
            : t('social.failedToast', { provider }),
        ),
    });
  };

  return (
    <Screen testID={authIds.loginScreen} header={<AuthBackButton testID={authIds.loginBack} />}>
      <VStack gap="xl" pt="xs">
        <AuthTitle
          testID={authIds.loginTitle}
          title={t('login.title')}
          subtitle={t('login.subtitle')}
        />
        <TextField
          testID={authIds.loginEmail}
          label={t('login.email')}
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChangeText={onChangeEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          {...(errors.email ? { errorText: errors.email } : {})}
        />
        <VStack gap="sm">
          <PasswordField
            testID={authIds.loginPassword}
            toggleTestID={authIds.loginTogglePassword}
            label={t('login.password')}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChangeText={onChangePassword}
            errorText={errors.password}
            autoComplete="current-password"
          />
          <Box align="flex-end">
            <Button
              testID={authIds.loginForgot}
              label={t('login.forgot')}
              variant="ghost"
              size="xs"
              onPress={() => router.push('/forgot')}
            />
          </Box>
        </VStack>
        {errors.general ? (
          <Card testID={authIds.loginError} variant="tint" padding="ml">
            <Text variant="small" color="brandDark">
              {errors.general}
            </Text>
          </Card>
        ) : null}
        <Button
          testID={authIds.loginSubmit}
          label={t('login.submit')}
          size="lg"
          fullWidth
          loading={busy}
          onPress={submit}
        />
        <SocialButtons
          appleTestID={authIds.loginApple}
          googleTestID={authIds.loginGoogle}
          termsTestID={authIds.loginSocialTerms}
          providers={providers}
          busy={socialSignIn.isPending ? (socialSignIn.variables ?? null) : null}
          onPress={social}
        />
        <AuthFooterLink
          testID={authIds.loginSignup}
          prompt={t('login.noAccount')}
          label={t('login.signup')}
          onPress={() => router.replace('/signup')}
        />
      </VStack>
    </Screen>
  );
}

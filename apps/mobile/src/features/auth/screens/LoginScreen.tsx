import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Box, Button, Card, Screen, Text, TextField, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { authIds } from '../auth.testids';
import { AuthBackButton } from '../components/AuthBackButton';
import { AuthFooterLink } from '../components/AuthFooterLink';
import { AuthTitle } from '../components/AuthTitle';
import { OrDivider } from '../components/OrDivider';
import { PasswordField } from '../components/PasswordField';
import { SocialButtons } from '../components/SocialButtons';
import { useDelayedAction } from '../hooks/useDelayedAction';
import { REQUEST_DELAY_MS } from '../model/auth.mock';
import { useAuthStore } from '../model/auth.store';
import { isEmailValid, MIN_LOGIN_PASSWORD, nameFromEmail } from '../model/auth.validation';

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
  const signIn = useAuthStore((s) => s.signIn);
  const signInWith = useAuthStore((s) => s.signInWith);
  const runLater = useDelayedAction();

  const [email, setEmail] = useState(storedEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const goConnect = () => router.push({ pathname: '/connect', params: { mode: 'onboarding' } });

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
    setBusy(true);
    runLater(() => {
      setBusy(false);
      // Mock credentials check from the prototype: short passwords are "wrong".
      if (password.length < MIN_LOGIN_PASSWORD) {
        setErrors({ general: t('login.errors.general') });
        return;
      }
      signIn({ name: nameFromEmail(email), email: email.trim() });
      showToast(t('login.welcomeToast'));
      goConnect();
    }, REQUEST_DELAY_MS);
  };

  const social = (provider: SocialProvider) => {
    signInWith(provider);
    showToast(t('social.connectedToast', { provider }));
    goConnect();
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
        <OrDivider />
        <SocialButtons
          appleTestID={authIds.loginApple}
          googleTestID={authIds.loginGoogle}
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

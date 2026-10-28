import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Button, Screen, Text, TextField, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { authIds } from '../auth.testids';
import { AuthBackButton } from '../components/AuthBackButton';
import { AuthFooterLink } from '../components/AuthFooterLink';
import { AuthTitle } from '../components/AuthTitle';
import { OrDivider } from '../components/OrDivider';
import { PasswordField } from '../components/PasswordField';
import { PasswordRules } from '../components/PasswordRules';
import { SocialButtons } from '../components/SocialButtons';
import { TermsCheckbox } from '../components/TermsCheckbox';
import { useDelayedAction } from '../hooks/useDelayedAction';
import { REQUEST_DELAY_MS } from '../model/auth.mock';
import { useAuthStore } from '../model/auth.store';
import { isEmailValid, isPasswordStrong } from '../model/auth.validation';

import type { SocialProvider } from '../model/auth.mock';

type Errors = {
  name?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
  terms?: string | undefined;
};

export function SignupScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const showToast = useFeedbackStore((s) => s.showToast);
  const signIn = useAuthStore((s) => s.signIn);
  const signInWith = useAuthStore((s) => s.signInWith);
  const runLater = useDelayedAction();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const goConnect = () => router.push({ pathname: '/connect', params: { mode: 'onboarding' } });

  const field =
    (key: 'name' | 'email' | 'password', setter: (value: string) => void) => (value: string) => {
      setter(value);
      setErrors((e) => ({ ...e, [key]: undefined }));
    };

  const toggleTerms = () => {
    setTerms((v) => !v);
    setErrors((e) => ({ ...e, terms: undefined }));
  };

  const submit = () => {
    const next: Errors = {};
    if (!name.trim()) next.name = t('signup.errors.name');
    if (!isEmailValid(email)) next.email = t('signup.errors.email');
    if (!isPasswordStrong(password)) next.password = t('signup.errors.password');
    if (!terms) next.terms = t('signup.errors.terms');
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    runLater(() => {
      setBusy(false);
      signIn({ name: name.trim(), email: email.trim() });
      goConnect();
    }, REQUEST_DELAY_MS);
  };

  const social = (provider: SocialProvider) => {
    signInWith(provider);
    showToast(t('social.connectedToast', { provider }));
    goConnect();
  };

  return (
    <Screen testID={authIds.signupScreen} header={<AuthBackButton testID={authIds.signupBack} />}>
      <VStack gap="xl" pt="xs">
        <AuthTitle
          testID={authIds.signupTitle}
          title={t('signup.title')}
          subtitle={t('signup.subtitle')}
        />
        <TextField
          testID={authIds.signupName}
          label={t('signup.name')}
          placeholder={t('signup.namePlaceholder')}
          value={name}
          onChangeText={field('name', setName)}
          autoComplete="name"
          {...(errors.name ? { errorText: errors.name } : {})}
        />
        <TextField
          testID={authIds.signupEmail}
          label={t('signup.email')}
          placeholder={t('signup.emailPlaceholder')}
          value={email}
          onChangeText={field('email', setEmail)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          {...(errors.email ? { errorText: errors.email } : {})}
        />
        <VStack gap="md">
          <PasswordField
            testID={authIds.signupPassword}
            toggleTestID={authIds.signupTogglePassword}
            label={t('signup.password')}
            placeholder={t('signup.passwordPlaceholder')}
            value={password}
            onChangeText={field('password', setPassword)}
            errorText={errors.password}
            autoComplete="new-password"
          />
          <PasswordRules testID={authIds.signupRules} password={password} />
        </VStack>
        <VStack gap="xs">
          <TermsCheckbox
            testID={authIds.signupTerms}
            checked={terms}
            error={Boolean(errors.terms)}
            onToggle={toggleTerms}
          />
          {errors.terms ? (
            <Text testID={authIds.signupTermsError} variant="caption" color="danger">
              {errors.terms}
            </Text>
          ) : null}
        </VStack>
        <Button
          testID={authIds.signupSubmit}
          label={t('signup.submit')}
          size="lg"
          fullWidth
          loading={busy}
          onPress={submit}
        />
        <OrDivider />
        <SocialButtons
          appleTestID={authIds.signupApple}
          googleTestID={authIds.signupGoogle}
          onPress={social}
        />
        <AuthFooterLink
          testID={authIds.signupLogin}
          prompt={t('signup.hasAccount')}
          label={t('signup.login')}
          onPress={() => router.replace('/login')}
        />
      </VStack>
    </Screen>
  );
}

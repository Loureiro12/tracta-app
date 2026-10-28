import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Box, Button, Logo, Screen, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { authIds } from '../auth.testids';
import { WelcomeCta } from '../components/WelcomeCta';
import { Wordmark } from '../components/Wordmark';

/** First screen for signed-out users: symbol + wordmark, the three questions and the two CTAs. */
export function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  return (
    <Screen testID={authIds.screen} scroll={false}>
      <Box flex={1} justify="center" gap="2xl">
        <VStack gap="xl">
          <Logo size={84} />
          <Wordmark testID={authIds.welcomeWordmark} />
        </VStack>
        <VStack gap="xs">
          <Text variant="heroSm">{t('welcome.question1')}</Text>
          <Text variant="heroSm" color="text2">
            {t('welcome.question2')}
          </Text>
          <Text variant="heroSm" color="text3">
            {t('welcome.question3')}
          </Text>
        </VStack>
        <Box style={styles.tagline}>
          <Text testID={authIds.welcomeTagline} color="text2">
            {t('welcome.tagline')}
          </Text>
        </Box>
      </Box>
      <VStack gap="sm" pb="lg">
        <WelcomeCta
          testID={authIds.welcomeSignup}
          title={t('welcome.signup')}
          hint={t('welcome.signupHint')}
          onPress={() => router.push('/signup')}
        />
        <Button
          testID={authIds.welcomeLogin}
          label={t('welcome.login')}
          variant="surface"
          size="lg"
          fullWidth
          onPress={() => router.push('/login')}
        />
        <Text variant="caption" color="text2" align="center">
          {t('welcome.loginHint')}
        </Text>
      </VStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tagline: { maxWidth: 300 },
});

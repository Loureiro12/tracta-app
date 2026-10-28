import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Box, Button, Icon, Screen, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { Trans, useTranslation } from '@/shared/i18n';

import { authIds } from '../auth.testids';
import { useCountdown } from '../hooks/useCountdown';
import { RESEND_SECONDS } from '../model/auth.mock';
import { useAuthStore } from '../model/auth.store';
import { formatCountdown } from '../model/auth.validation';

/** "Check your e-mail" confirmation after the reset link is sent, with the 30 s resend countdown. */
export function SentScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const showToast = useFeedbackStore((s) => s.showToast);
  const email = useAuthStore((s) => s.email);
  const { remaining, restart } = useCountdown(RESEND_SECONDS);

  const resend = () => {
    restart();
    showToast(t('sent.resentToast'));
  };

  return (
    <Screen testID={authIds.sentScreen} scroll={false}>
      <Box flex={1} justify="center" gap="xl">
        <Box bg="surface" radius="card" align="center" justify="center" style={styles.icon}>
          <Icon name="mail" size={32} color="brandText" />
        </Box>
        <VStack gap="sm">
          <Text testID={authIds.sentTitle} variant="overlayTitle" accessibilityRole="header">
            {t('sent.title')}
          </Text>
          <Text testID={authIds.sentBody} color="text2">
            <Trans
              t={t}
              ns="auth"
              i18nKey="sent.body"
              values={{ email }}
              components={{ b: <Text variant="bodySemibold" /> }}
            />
          </Text>
        </VStack>
        <Text variant="secondary" color="text2">
          {t('sent.spam')}
        </Text>
      </Box>
      <VStack gap="sm" pb="lg">
        <Button
          testID={authIds.sentOpenMail}
          label={t('sent.openMail')}
          size="lg"
          fullWidth
          onPress={() => showToast(t('sent.openMailToast'))}
        />
        <Button
          testID={authIds.sentResend}
          label={
            remaining > 0
              ? t('sent.resendIn', { time: formatCountdown(remaining) })
              : t('sent.resend')
          }
          variant="surface"
          size="lg"
          fullWidth
          disabled={remaining > 0}
          onPress={resend}
        />
        <Button
          testID={authIds.sentLogin}
          label={t('sent.backToLogin')}
          variant="ghost"
          size="sm"
          fullWidth
          onPress={() => router.navigate('/login')}
        />
      </VStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { width: 72, height: 72 },
});

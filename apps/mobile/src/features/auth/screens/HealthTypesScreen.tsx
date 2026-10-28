import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Box, Button, Card, HStack, Screen, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { authIds } from '../auth.testids';
import { AuthBackButton } from '../components/AuthBackButton';
import { AuthTitle } from '../components/AuthTitle';
import { ToggleRow } from '../components/ToggleRow';
import { READ_TYPES, WRITE_TYPES } from '../model/auth.mock';
import { useAuthStore } from '../model/auth.store';

/** Apple Health permission sheet: one switch per data type, read and write authorized separately. */
export function HealthTypesScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const showToast = useFeedbackStore((s) => s.showToast);
  const permissions = useAuthStore((s) => s.permissions);
  const togglePermission = useAuthStore((s) => s.togglePermission);
  const setAllRead = useAuthStore((s) => s.setAllRead);
  const connectHealth = useAuthStore((s) => s.connectHealth);

  const allRead = READ_TYPES.every((type) => permissions[`read.${type}`]);
  const count = Object.values(permissions).filter(Boolean).length;

  const allow = () => {
    if (count === 0) {
      showToast(t('health.allowNoneToast'));
      return;
    }
    connectHealth(() => showToast(t('health.connectedToast')));
    router.back();
  };

  const footer = (
    <Box px="screen" pt="md" pb="3xl" borderColor="divider" style={styles.footer}>
      <Button
        testID={authIds.healthAllow}
        label={count > 0 ? t('health.allow', { count }) : t('health.allowNone')}
        size="lg"
        fullWidth
        onPress={allow}
      />
    </Box>
  );

  return (
    <Screen
      testID={authIds.healthScreen}
      header={<AuthBackButton testID={authIds.healthBack} />}
      footer={footer}
    >
      <VStack gap="ml" pt="xs">
        <AuthTitle
          testID={authIds.healthTitle}
          title={t('health.title')}
          subtitle={t('health.subtitle')}
        />
        <HStack justify="space-between" pt="xs">
          <Text variant="secondarySemibold">{t('health.readLabel')}</Text>
          <Button
            testID={authIds.healthToggleAll}
            label={allRead ? t('health.disableAll') : t('health.enableAll')}
            variant="ghost"
            size="xs"
            onPress={() => setAllRead(!allRead)}
          />
        </HStack>
        <Card testID={authIds.healthRead} padding="xxs" px="xl" gap="none">
          {READ_TYPES.map((type, i) => (
            <ToggleRow
              key={type}
              testID={`${authIds.healthRead}.${type}`}
              label={t(`health.read.${type}.name`)}
              description={t(`health.read.${type}.why`)}
              value={permissions[`read.${type}`]}
              onValueChange={() => togglePermission(`read.${type}`)}
              last={i === READ_TYPES.length - 1}
            />
          ))}
        </Card>
        <Box pt="xs">
          <Text variant="secondarySemibold">{t('health.writeLabel')}</Text>
        </Box>
        <Card testID={authIds.healthWrite} padding="xxs" px="xl" gap="none">
          {WRITE_TYPES.map((type, i) => (
            <ToggleRow
              key={type}
              testID={`${authIds.healthWrite}.${type}`}
              label={t(`health.write.${type}.name`)}
              description={t(`health.write.${type}.why`)}
              value={permissions[`write.${type}`]}
              onValueChange={() => togglePermission(`write.${type}`)}
              last={i === WRITE_TYPES.length - 1}
            />
          ))}
        </Card>
        <Text variant="caption" color="text2">
          {t('health.note')}
        </Text>
      </VStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1 },
});

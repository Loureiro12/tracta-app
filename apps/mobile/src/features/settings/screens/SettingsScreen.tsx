import { useRouter } from 'expo-router';

import {
  BackHeader,
  Button,
  Card,
  HStack,
  Heading,
  ListGroup,
  ListRow,
  Screen,
  SectionLabel,
  Text,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useSettingsStore } from '../model/settings.store';
import { settingsIds } from '../settings.testids';

import type { LocalePreference } from '@/shared/i18n';
import type { ThemePreference } from '@tracta/design-system';

const themeOptions: { value: ThemePreference; testID: string }[] = [
  { value: 'system', testID: settingsIds.themeSystem },
  { value: 'light', testID: settingsIds.themeLight },
  { value: 'dark', testID: settingsIds.themeDark },
];

const languageOptions: { value: LocalePreference; testID: string }[] = [
  { value: 'system', testID: settingsIds.languageSystem },
  { value: 'en', testID: settingsIds.languageEn },
  { value: 'pt-BR', testID: settingsIds.languagePtBr },
];

/** App preferences (theme, language) plus demo switches for the design's edge states. */
export function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const localePreference = useSettingsStore((s) => s.localePreference);
  const setLocalePreference = useSettingsStore((s) => s.setLocalePreference);
  const setBanner = useFeedbackStore((s) => s.setBanner);
  const showToast = useFeedbackStore((s) => s.showToast);

  return (
    <Screen
      testID={settingsIds.screen}
      header={
        <BackHeader testID={settingsIds.back} label={t('back')} onPress={() => router.back()} />
      }
    >
      <Heading testID={settingsIds.title}>{t('title')}</Heading>

      <SectionLabel>{t('theme.label')}</SectionLabel>
      <Card gap="md">
        <Text testID={settingsIds.themeCurrent}>
          {t('theme.current', { value: t(`theme.${themePreference}`) })}
        </Text>
        <HStack gap="sm">
          {themeOptions.map((option) => (
            <Button
              key={option.value}
              testID={option.testID}
              label={t(`theme.${option.value}`)}
              variant={option.value === themePreference ? 'primary' : 'secondary'}
              size="xs"
              onPress={() => setThemePreference(option.value)}
            />
          ))}
        </HStack>
      </Card>

      <SectionLabel>{t('language.label')}</SectionLabel>
      <Card gap="md">
        <Text testID={settingsIds.languageCurrent}>
          {t('language.current', { value: t(`language.${localePreference}`) })}
        </Text>
        <HStack gap="sm" wrap="wrap">
          {languageOptions.map((option) => (
            <Button
              key={option.value}
              testID={option.testID}
              label={t(`language.${option.value}`)}
              variant={option.value === localePreference ? 'primary' : 'secondary'}
              size="xs"
              onPress={() => setLocalePreference(option.value)}
            />
          ))}
        </HStack>
      </Card>

      <SectionLabel>{t('demo.label')}</SectionLabel>
      <VStack gap="sm">
        <Text variant="caption" color="text2">
          {t('demo.hint')}
        </Text>
        <ListGroup>
          <ListRow
            testID={settingsIds.demoOffline}
            label={t('demo.offline')}
            chevron
            onPress={() =>
              setBanner({
                variant: 'offline',
                title: t('demo.offlineTitle'),
                description: t('demo.offlineDescription'),
              })
            }
          />
          <ListRow
            testID={settingsIds.demoSync}
            label={t('demo.sync')}
            chevron
            onPress={() =>
              setBanner({
                variant: 'sync',
                title: t('demo.syncTitle'),
                description: t('demo.syncDescription'),
                ctaLabel: t('demo.syncCta'),
              })
            }
          />
          <ListRow
            testID={settingsIds.demoToast}
            label={t('demo.toast')}
            chevron
            onPress={() => showToast(t('demo.toastMessage'))}
          />
          <ListRow
            testID={settingsIds.demoClear}
            label={t('demo.clear')}
            labelColor="danger"
            onPress={() => setBanner(null)}
          />
        </ListGroup>
      </VStack>
    </Screen>
  );
}

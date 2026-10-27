import { useRouter } from 'expo-router';

import { Button, Heading, HStack, Screen, Text, VStack } from '@tracta/design-system';

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

export function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const localePreference = useSettingsStore((s) => s.localePreference);
  const setLocalePreference = useSettingsStore((s) => s.setLocalePreference);

  return (
    <Screen testID={settingsIds.screen}>
      <Heading testID={settingsIds.title}>{t('title')}</Heading>

      <VStack gap="sm">
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
              size="sm"
              onPress={() => setThemePreference(option.value)}
            />
          ))}
        </HStack>
      </VStack>

      <VStack gap="sm">
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
              size="sm"
              onPress={() => setLocalePreference(option.value)}
            />
          ))}
        </HStack>
      </VStack>

      <Button
        testID={settingsIds.back}
        label={t('back')}
        variant="ghost"
        onPress={() => router.back()}
      />
    </Screen>
  );
}

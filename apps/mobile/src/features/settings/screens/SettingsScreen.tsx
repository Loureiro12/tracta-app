import { useRouter } from 'expo-router';

import { Button, Heading, HStack, Screen, Text, VStack } from '@tracta/design-system';

import { useSettingsStore } from '../model/settings.store';
import { settingsIds } from '../settings.testids';

import type { ThemePreference } from '@tracta/design-system';

const options: { value: ThemePreference; label: string; testID: string }[] = [
  { value: 'system', label: 'System', testID: settingsIds.themeSystem },
  { value: 'light', label: 'Light', testID: settingsIds.themeLight },
  { value: 'dark', label: 'Dark', testID: settingsIds.themeDark },
];

export function SettingsScreen() {
  const router = useRouter();
  const preference = useSettingsStore((s) => s.themePreference);
  const setPreference = useSettingsStore((s) => s.setThemePreference);

  return (
    <Screen testID={settingsIds.screen}>
      <Heading testID={settingsIds.title}>Settings</Heading>
      <VStack gap="sm">
        <Text testID={settingsIds.themeCurrent}>{`Theme: ${preference}`}</Text>
        <HStack gap="sm">
          {options.map((option) => (
            <Button
              key={option.value}
              testID={option.testID}
              label={option.label}
              variant={option.value === preference ? 'primary' : 'secondary'}
              size="sm"
              onPress={() => setPreference(option.value)}
            />
          ))}
        </HStack>
      </VStack>
      <Button
        testID={settingsIds.back}
        label="Back"
        variant="ghost"
        onPress={() => router.back()}
      />
    </Screen>
  );
}

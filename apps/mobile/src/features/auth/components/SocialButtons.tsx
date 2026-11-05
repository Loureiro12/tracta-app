import { Box, Button, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { OrDivider } from './OrDivider';

import type { SocialProvider } from '../model/auth.mock';

type Props = {
  appleTestID: string;
  googleTestID: string;
  termsTestID: string;
  /** The providers this device offers; nothing renders without any. */
  providers: readonly SocialProvider[];
  /** The provider whose sign-in is running (its button spins, the others wait). */
  busy: SocialProvider | null;
  onPress: (provider: SocialProvider) => void;
};

/** "or" + Apple / Google sign-in (white, outlined, side by side) + what continuing accepts. */
export function SocialButtons({
  appleTestID,
  googleTestID,
  termsTestID,
  providers,
  busy,
  onPress,
}: Props) {
  const { t } = useTranslation('auth');
  if (providers.length === 0) return null;
  const items: { provider: SocialProvider; testID: string; label: string }[] = [
    { provider: 'Apple', testID: appleTestID, label: t('apple') },
    { provider: 'Google', testID: googleTestID, label: t('google') },
  ];
  const button = ({ provider, testID, label }: (typeof items)[number]) => (
    <Box key={provider} flex={1}>
      <Button
        testID={testID}
        label={label}
        variant="surface"
        size="md"
        shape="rounded"
        fullWidth
        loading={busy === provider}
        disabled={busy != null && busy !== provider}
        onPress={() => onPress(provider)}
      />
    </Box>
  );
  return (
    <VStack gap="xl">
      <OrDivider />
      <VStack gap="sm">
        <HStack gap="sm">{items.filter((i) => providers.includes(i.provider)).map(button)}</HStack>
        {/* A first sign-in creates the account without the sign-up checkbox. */}
        <Text testID={termsTestID} variant="caption" color="text2">
          {t('social.terms')}
        </Text>
      </VStack>
    </VStack>
  );
}

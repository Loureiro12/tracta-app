import { Box, Button, HStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import type { SocialProvider } from '../model/auth.mock';

type Props = {
  appleTestID: string;
  googleTestID: string;
  onPress: (provider: SocialProvider) => void;
};

/** Apple / Google sign-in pair (white, outlined, side by side). */
export function SocialButtons({ appleTestID, googleTestID, onPress }: Props) {
  const { t } = useTranslation('auth');
  return (
    <HStack gap="sm">
      <Box flex={1}>
        <Button
          testID={appleTestID}
          label={t('apple')}
          variant="surface"
          size="md"
          shape="rounded"
          fullWidth
          onPress={() => onPress('Apple')}
        />
      </Box>
      <Box flex={1}>
        <Button
          testID={googleTestID}
          label={t('google')}
          variant="surface"
          size="md"
          shape="rounded"
          fullWidth
          onPress={() => onPress('Google')}
        />
      </Box>
    </HStack>
  );
}

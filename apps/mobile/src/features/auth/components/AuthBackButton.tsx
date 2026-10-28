import { useRouter } from 'expo-router';

import { Box, IconButton } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

type Props = { testID: string; onPress?: () => void };

/** 44px white round "‹" button at the top of the auth screens (prototype: padding 2px 16px). */
export function AuthBackButton({ testID, onPress }: Props) {
  const router = useRouter();
  const { t } = useTranslation('auth');
  return (
    <Box px="lg" pt="xxs" align="flex-start">
      <IconButton
        testID={testID}
        icon="chevron-left"
        label={t('back')}
        variant="surface"
        size={44}
        onPress={onPress ?? (() => router.back())}
      />
    </Box>
  );
}

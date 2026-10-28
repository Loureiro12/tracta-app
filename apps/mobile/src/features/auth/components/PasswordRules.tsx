import { StyleSheet } from 'react-native';

import { Box, HStack, Icon, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { checkPasswordRules, PASSWORD_RULES } from '../model/auth.validation';

type Props = { testID: string; password: string };

/** The three password requirements with an 18px check that fills in brand when satisfied. */
export function PasswordRules({ testID, password }: Props) {
  const { t } = useTranslation('auth');
  const status = checkPasswordRules(password);
  return (
    <VStack testID={testID} gap="sm">
      {PASSWORD_RULES.map((rule) => {
        const ok = status[rule];
        return (
          <HStack key={rule} testID={`${testID}.${rule}`} gap="sm">
            <Box
              bg={ok ? 'brand' : 'switchOff'}
              radius="full"
              align="center"
              justify="center"
              style={styles.check}
            >
              <Icon name="check" size={10} color="textOnBrand" />
            </Box>
            <Text variant="secondary" color={ok ? 'text' : 'text2'}>
              {t(`signup.rules.${rule}`)}
            </Text>
          </HStack>
        );
      })}
    </VStack>
  );
}

const styles = StyleSheet.create({
  check: { width: 18, height: 18 },
});

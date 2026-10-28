import { StyleSheet } from 'react-native';

import { Box, Icon, Pressable, Text } from '@tracta/design-system';

import { Trans, useTranslation } from '@/shared/i18n';

type Props = { testID: string; checked: boolean; error: boolean; onToggle: () => void };

/** 26px square checkbox + "I have read and accept the Terms…" copy with bold links. */
export function TermsCheckbox({ testID, checked, error, onToggle }: Props) {
  const { t } = useTranslation('auth');
  return (
    <Pressable
      testID={testID}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <Box
        bg={checked ? 'ink' : 'surface'}
        borderColor={error ? 'danger' : checked ? 'ink' : 'dividerStrong'}
        borderWidth={1.5}
        radius="xs"
        align="center"
        justify="center"
        style={styles.box}
      >
        {checked ? <Icon name="check" size={12} color="textOnInk" /> : null}
      </Box>
      <Box flex={1}>
        <Text variant="small">
          <Trans
            t={t}
            ns="auth"
            i18nKey="signup.terms"
            components={{ b: <Text variant="smallBold" /> }}
          />
        </Text>
      </Box>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  box: { width: 26, height: 26 },
});

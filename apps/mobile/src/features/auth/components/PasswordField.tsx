import { useState } from 'react';

import { Button, TextField } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

type Props = {
  testID: string;
  toggleTestID: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  errorText?: string | undefined;
  autoComplete: 'current-password' | 'new-password';
};

/** Password input with the inline "Show / Hide" toggle from the prototype. */
export function PasswordField({
  testID,
  toggleTestID,
  label,
  placeholder,
  value,
  onChangeText,
  errorText,
  autoComplete,
}: Props) {
  const { t } = useTranslation('auth');
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      testID={testID}
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!visible}
      // Keeps iOS from covering the field with the "Automatic Strong Password" suggestion.
      textContentType="oneTimeCode"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={autoComplete}
      {...(errorText ? { errorText } : {})}
      trailing={
        <Button
          testID={toggleTestID}
          label={visible ? t('hidePassword') : t('showPassword')}
          variant="ghost"
          size="xs"
          onPress={() => setVisible((v) => !v)}
        />
      }
    />
  );
}

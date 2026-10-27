import { useMemo, useState } from 'react';

import { TextInput } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { TextInputProps, TextStyle } from 'react-native';

export type TextFieldProps = Testable &
  Omit<TextInputProps, 'testID' | 'style' | 'placeholderTextColor'> & {
    label: string;
    helperText?: string;
    errorText?: string;
  };

/** Labeled text input with helper/error states. */
export function TextField({
  label,
  helperText,
  errorText,
  testID,
  editable = true,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);

  const inputStyle = useMemo<TextStyle>(
    () => ({
      ...theme.typography.bodyMd,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: hasError
        ? theme.colors.danger
        : focused
          ? theme.colors.focusRing
          : theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: 44,
      opacity: editable ? 1 : 0.5,
    }),
    [theme, hasError, focused, editable],
  );

  return (
    <VStack testID={testID} gap="xs">
      <Text testID={`${testID}.label`} variant="label" color="textSecondary">
        {label}
      </Text>
      <TextInput
        testID={`${testID}.input`}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textMuted}
        style={inputStyle}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {hasError ? (
        <Text testID={`${testID}.error`} variant="caption" color="danger">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text testID={`${testID}.helper`} variant="caption" color="textMuted">
          {helperText}
        </Text>
      ) : null}
    </VStack>
  );
}

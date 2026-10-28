import { useMemo, useState } from 'react';

import { TextInput } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { ReactNode } from 'react';
import type { TextInputProps, TextStyle } from 'react-native';

export type TextFieldProps = Testable &
  Omit<TextInputProps, 'testID' | 'style' | 'placeholderTextColor'> & {
    label?: string;
    helperText?: string;
    errorText?: string;
    /** Element rendered inside the field on the right (unit, icon, button). */
    trailing?: ReactNode;
  };

/** Labeled text input: white, 50px, radius 14; inline validation below the field. */
export function TextField({
  label,
  helperText,
  errorText,
  trailing,
  testID,
  editable = true,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);

  const inputStyle = useMemo<TextStyle>(
    () => ({
      ...theme.typography.bodyLg,
      flex: 1,
      color: theme.colors.text,
      paddingHorizontal: theme.spacing.ml,
      paddingVertical: 0,
      height: 50,
    }),
    [theme],
  );
  const frameStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.surface,
      borderColor: hasError
        ? theme.colors.danger
        : focused
          ? theme.colors.ink
          : theme.colors.outline,
      borderWidth: 1,
      borderRadius: theme.radii.md,
      opacity: editable ? 1 : 0.5,
    }),
    [theme, hasError, focused, editable],
  );

  return (
    <VStack testID={testID} gap="xs">
      {label ? (
        <Text testID={`${testID}.label`} variant="secondarySemibold" color="text2">
          {label}
        </Text>
      ) : null}
      <Box direction="row" align="center" style={frameStyle}>
        <TextInput
          testID={`${testID}.input`}
          accessibilityLabel={label ?? rest.placeholder}
          placeholderTextColor={theme.colors.text3}
          style={inputStyle}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {trailing ? (
          <Box testID={`${testID}.trailing`} pr="ml">
            {trailing}
          </Box>
        ) : null}
      </Box>
      {hasError ? (
        <Text testID={`${testID}.error`} variant="caption" color="danger">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text testID={`${testID}.helper`} variant="caption" color="text2">
          {helperText}
        </Text>
      ) : null}
    </VStack>
  );
}

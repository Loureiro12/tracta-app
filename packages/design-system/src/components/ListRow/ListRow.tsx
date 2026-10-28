import { Children, useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Icon } from '../Icon/Icon';
import { Pressable } from '../Pressable/Pressable';
import { Text } from '../Text/Text';

import type { MaybeTestable, Testable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { ReactNode } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';

export type ListRowProps = Testable & {
  label: string;
  description?: string;
  /** Right-aligned value (semibold). */
  value?: string;
  valueColor?: keyof SemanticColors;
  labelColor?: keyof SemanticColors;
  /** Custom right element (switch, button, avatar). */
  trailing?: ReactNode;
  /** Custom left element (icon, letter badge). */
  leading?: ReactNode;
  chevron?: boolean;
  onPress?: NonNullable<PressableProps['onPress']>;
  /** Hide the bottom hairline (ListGroup sets this on the last row). */
  last?: boolean;
};

/** 50px list row with label, optional description, value and chevron. */
export function ListRow({
  label,
  description,
  value,
  valueColor = 'text',
  labelColor = 'text',
  trailing,
  leading,
  chevron = false,
  onPress,
  last = false,
  testID,
}: ListRowProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: theme.colors.divider,
    }),
    [theme, last],
  );
  const content = (
    <>
      {leading}
      <Box flex={1} gap="xxs">
        <Text testID={`${testID}.label`} variant="body" color={labelColor}>
          {label}
        </Text>
        {description ? (
          <Text testID={`${testID}.description`} variant="caption" color="text2">
            {description}
          </Text>
        ) : null}
      </Box>
      {value ? (
        <Text testID={`${testID}.value`} variant="bodySemibold" color={valueColor}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {chevron ? <Icon name="chevron-right" size={16} color="text3" /> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable testID={testID} onPress={onPress} style={style} accessibilityLabel={label}>
        {content}
      </Pressable>
    );
  }
  return (
    <Box testID={testID} style={style}>
      {content}
    </Box>
  );
}

export type ListGroupProps = MaybeTestable & { children: ReactNode };

/** White card that hosts ListRows (2px vertical padding, 18px horizontal), marking the last row. */
export function ListGroup({ children, testID }: ListGroupProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.card,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxs,
    }),
    [theme],
  );
  const items = Children.toArray(children);
  return (
    <Box testID={testID} style={style}>
      {items.map((child, i) => (
        <Box key={i} style={i === items.length - 1 ? styles.lastRow : undefined}>
          {child}
        </Box>
      ))}
    </Box>
  );
}

const styles = { lastRow: { marginBottom: -1 } as const };

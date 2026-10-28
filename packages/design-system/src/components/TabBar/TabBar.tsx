import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Icon } from '../Icon/Icon';
import { Pressable } from '../Pressable/Pressable';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { IconName } from '../Icon/Icon';
import type { ViewStyle } from 'react-native';

export type TabBarItem = {
  key: string;
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
  testID: string;
};

export type TabBarProps = Testable & {
  items: readonly TabBarItem[];
};

/** 5-tab bar: translucent sand with blur, 24px line icons and 10.5px labels. */
export function TabBar({ items, testID }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const style = useMemo<ViewStyle>(
    () => ({
      paddingTop: 6,
      paddingHorizontal: 6,
      paddingBottom: Math.max(insets.bottom, 12),
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      backgroundColor: theme.colors.tabBar,
      flexDirection: 'row',
    }),
    [theme, insets.bottom],
  );
  return (
    <BlurView intensity={16} tint={theme.scheme === 'dark' ? 'dark' : 'light'} style={styles.blur}>
      <Box testID={testID} style={style} accessibilityRole="tablist">
        {items.map((item) => (
          <Pressable
            key={item.key}
            testID={item.testID}
            onPress={item.onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: item.active }}
            accessibilityLabel={item.label}
            style={styles.item}
          >
            <Icon name={item.icon} size={24} color={item.active ? 'text' : 'text3'} />
            <Text variant="tab" color={item.active ? 'text' : 'text3'}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </Box>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  item: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
});

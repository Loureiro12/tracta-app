import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Box, FloatingBar, TabBar } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import type { TabBarItem } from '@tracta/design-system';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';

const TABS: {
  name: string;
  key: 'home' | 'health' | 'workouts' | 'history' | 'profile';
  icon: TabBarItem['icon'];
  testID: string;
}[] = [
  { name: 'index', key: 'home', icon: 'home', testID: 'app.tab.home' },
  { name: 'health', key: 'health', icon: 'heart', testID: 'app.tab.health' },
  { name: 'workouts', key: 'workouts', icon: 'activity', testID: 'app.tab.workouts' },
  { name: 'history', key: 'history', icon: 'calendar', testID: 'app.tab.history' },
  { name: 'profile', key: 'profile', icon: 'user', testID: 'app.tab.profile' },
];

/** Adapts expo-router's bottom-tab props to the design-system TabBar and hosts the mini-player. */
export function AppTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const mini = useFeedbackStore((s) => s.miniPlayer);
  const activeName = state.routes[state.index]?.name;

  const items: TabBarItem[] = TABS.map((tab) => {
    const route = state.routes.find((r) => r.name === tab.name);
    return {
      key: tab.key,
      label: t(`tabs.${tab.key}`),
      icon: tab.icon,
      active: activeName === tab.name,
      testID: tab.testID,
      onPress: () => {
        if (route) navigateToTab(route.key);
      },
    };
  });

  return (
    <>
      {mini ? (
        <Box pointerEvents="box-none" style={styles.mini}>
          <FloatingBar
            testID="app.mini-player"
            title={mini.title}
            subtitle={mini.subtitle}
            actionLabel={t('actions.resume')}
            onPress={() => router.push(mini.href as never)}
          />
        </Box>
      ) : null}
      <TabBar testID="app.tab-bar" items={items} />
    </>
  );
}

const styles = StyleSheet.create({
  mini: { position: 'absolute', left: 12, right: 12, bottom: 96 },
});

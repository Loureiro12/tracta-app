import { Fragment } from 'react';

import { useRouter } from 'expo-router';

import { Avatar, IconButton, Pressable, Screen, ScreenHeader } from '@tracta/design-system';

import { useInboxUnreadCount } from '@/features/inbox';
import { env } from '@/shared/config/env';
import { formatDate, useTranslation } from '@/shared/i18n';

import { ChecklistCard } from '../components/ChecklistCard';
import { DevToolsRow } from '../components/DevToolsRow';
import { FriendsCard } from '../components/FriendsCard';
import { LastActivityCard } from '../components/LastActivityCard';
import { MovementCard } from '../components/MovementCard';
import { NextWorkoutCard } from '../components/NextWorkoutCard';
import { SleepCard } from '../components/SleepCard';
import { StatsRow } from '../components/StatsRow';
import { SyncLine } from '../components/SyncLine';
import { WeeklyCard } from '../components/WeeklyCard';
import { homeIds } from '../home.testids';
import { HOME_TODAY, USER_INITIAL } from '../model/home.mock';
import { useHomeStore } from '../model/home.store';

import type { HomeCardKey } from '../model/home.store';

/** "Segunda, 26 de outubro" — locale formatted, first letter upper-cased (pt-BR weekdays are lower-case). */
function eyebrowDate(date: Date): string {
  const text = formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Início tab: sticky header, onboarding checklist, health sync line and the customizable cards. */
export function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const cards = useHomeStore((s) => s.cards);
  const density = useHomeStore((s) => s.density);
  const isNewUser = useHomeStore((s) => s.isNewUser);
  const weeklySeen = useHomeStore((s) => s.weeklySeen);
  const doneToday = useHomeStore((s) => s.doneToday);
  const unread = useInboxUnreadCount();
  const detailed = density === 'detailed';

  const renderCard = (key: HomeCardKey) => {
    switch (key) {
      case 'sleep':
        return <SleepCard detailed={detailed} />;
      case 'move':
        return <MovementCard detailed={detailed} />;
      case 'stats':
        return <StatsRow weekDone={doneToday ? 1 : 0} />;
      case 'next':
        return <NextWorkoutCard doneToday={doneToday} />;
      case 'last':
        return <LastActivityCard />;
    }
  };

  return (
    <Screen
      testID={homeIds.screen}
      bottomInset="tab"
      header={
        <ScreenHeader
          testID={homeIds.header}
          eyebrow={eyebrowDate(HOME_TODAY)}
          title={t('header.title')}
          actions={
            <>
              <IconButton
                testID={homeIds.navEdit}
                icon="sliders"
                label={t('nav.edit')}
                onPress={() => router.push('/home/edit')}
              />
              <IconButton
                testID={homeIds.navInbox}
                icon="bell"
                label={t('nav.inbox')}
                badge={unread}
                onPress={() => router.push('/inbox')}
              />
              <Pressable
                testID={homeIds.navProfile}
                onPress={() => router.push('/profile')}
                accessibilityLabel={t('nav.profile')}
              >
                <Avatar initial={USER_INITIAL} />
              </Pressable>
            </>
          }
        />
      }
    >
      {isNewUser ? <ChecklistCard /> : null}
      <SyncLine />
      {weeklySeen ? null : <WeeklyCard />}
      {cards
        .filter((card) => card.on)
        .map((card) => (
          <Fragment key={card.key}>{renderCard(card.key)}</Fragment>
        ))}
      <FriendsCard />
      {env.showDevTools ? <DevToolsRow /> : null}
    </Screen>
  );
}

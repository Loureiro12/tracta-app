import { useMemo, useState } from 'react';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  Divider,
  HStack,
  Screen,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatNumber, useTranslation } from '@/shared/i18n';

import { clock } from '../model/session.logic';
import { sessionRoutes } from '../model/session.routes';
import { useSessionStore } from '../model/session.store';
import { sessionIds } from '../session.testids';

import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

const kg = (value: number) => formatNumber(value, { maximumFractionDigits: 2 });

function Stat({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <Box flex={1} bg="surface" radius="xl" p="ml" gap="xxs">
      <Text variant="caption" color="text2">
        {label}
      </Text>
      <Text testID={testID} variant="heroSm" numberOfLines={1}>
        {value}
      </Text>
    </Box>
  );
}

function PrBadge({ children }: { children: ReactNode }) {
  return (
    <Box bg="ink" radius="xs" px="xs" py="xxs">
      <Text variant="microBold" color="textOnInk">
        {children}
      </Text>
    </Box>
  );
}

/** End-of-workout review: totals, records, next-session loads, per-exercise rows and the save CTA. */
export function SummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(['session', 'common']);
  const showToast = useFeedbackStore((s) => s.showToast);
  const setMiniPlayer = useFeedbackStore((s) => s.setMiniPlayer);
  const summary = useSessionStore((s) => s.summary);
  const endSession = useSessionStore((s) => s.endSession);
  const [discardArmed, setDiscardArmed] = useState(false);

  const footerStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.bg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.dividerStrong,
      paddingHorizontal: theme.spacing.screen,
      paddingTop: theme.spacing.ml,
      paddingBottom: theme.spacing['3xl'],
      gap: theme.spacing.sm,
    }),
    [theme],
  );

  const leaveToHome = () => {
    setMiniPlayer(null);
    endSession();
    router.replace(sessionRoutes.home());
  };
  const save = () => {
    showToast(t('session:summary.saved'));
    leaveToHome();
  };
  const discard = () => {
    if (!discardArmed) {
      setDiscardArmed(true);
      return;
    }
    showToast(t('session:summary.discarded'));
    leaveToHome();
  };

  if (!summary) {
    return (
      <Screen testID={sessionIds.summaryScreen} scroll={false}>
        <Box />
      </Screen>
    );
  }

  return (
    <Screen
      testID={sessionIds.summaryScreen}
      footer={
        <Box style={footerStyle}>
          <Button
            testID={sessionIds.summarySave}
            label={t('session:summary.save')}
            size="xl"
            icon="check"
            fullWidth
            elevated
            onPress={save}
          />
          <Text variant="caption" color="text2" align="center">
            {t('session:summary.saveNote')}
          </Text>
        </Box>
      }
    >
      <Text variant="secondary" color="text2">
        {t('session:summary.eyebrow', { name: `${summary.name} · ${summary.focus}` })}
      </Text>
      <Text testID={sessionIds.summaryTitle} variant="overlayTitle" numberOfLines={1}>
        {t('session:summary.title')}
      </Text>

      <VStack gap="sm" pt="xs">
        <HStack gap="sm" align="stretch">
          <Stat label={t('session:summary.duration')} value={clock(summary.durationSec)} />
          <Stat
            testID={sessionIds.summarySets}
            label={t('session:summary.sets')}
            value={String(summary.sets)}
          />
        </HStack>
        <HStack gap="sm" align="stretch">
          <Stat label={t('session:summary.reps')} value={String(summary.reps)} />
          <Stat
            testID={sessionIds.summaryVolume}
            label={t('session:summary.volume')}
            value={t('session:summary.volumeValue', { value: kg(summary.volumeKg) })}
          />
        </HStack>
      </VStack>

      <Card gap="sm">
        <Text variant="bodySemibold">{t('session:summary.prsTitle')}</Text>
        {summary.prs.map((pr) => (
          <HStack key={pr.name} gap="sm">
            <PrBadge>{t('session:summary.prBadge')}</PrBadge>
            <Box flex={1}>
              <Text variant="small">
                {pr.bodyweight
                  ? t('session:summary.prReps', {
                      name: pr.name,
                      value: pr.value,
                      previous: pr.previous,
                    })
                  : t('session:summary.prKg', {
                      name: pr.name,
                      value: kg(pr.value),
                      previous: kg(pr.previous),
                    })}
              </Text>
            </Box>
          </HStack>
        ))}
        {summary.prs.length === 0 ? (
          <Text testID={sessionIds.summaryNoPr} variant="small" color="text2">
            {t('session:summary.noPr')}
          </Text>
        ) : null}
      </Card>

      {summary.next.length > 0 ? (
        <Card testID={sessionIds.summaryNext} variant="tint" gap="sm">
          <Text variant="bodySemibold">{t('session:summary.nextTitle')}</Text>
          {summary.next.map((x) => (
            <Text key={x.name} variant="small">
              {t('session:summary.nextItem', { name: x.name, kg: kg(x.kg) })}
            </Text>
          ))}
          <Text variant="caption" color="text2">
            {t('session:summary.nextNote')}
          </Text>
        </Card>
      ) : null}

      <Card padding="xs" px="xl" gap="none">
        {summary.rows.map((row, i) => (
          <Box key={row.name}>
            <VStack gap="xxs" py="md">
              <Text variant="bodySemibold">{row.name}</Text>
              <Text variant="secondary" color="text2">
                {row.sets.length
                  ? row.sets
                      .map((s) =>
                        s.kg == null
                          ? t('session:set.summaryReps', { reps: s.reps })
                          : t('session:set.summaryKg', { kg: kg(s.kg), reps: s.reps }),
                      )
                      .join(', ')
                  : t('session:summary.notDone')}
              </Text>
            </VStack>
            {i < summary.rows.length - 1 ? <Divider /> : null}
          </Box>
        ))}
      </Card>

      <Card gap="sm">
        <Text variant="bodySemibold">{t('session:summary.destTitle')}</Text>
        <HStack justify="space-between">
          <Text variant="small">{t('session:summary.destLocal')}</Text>
          <Text variant="smallSemibold" color="text2">
            {t('session:summary.pending')}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text variant="small">{t('session:summary.destHealth')}</Text>
          <Text variant="smallSemibold" color="text2">
            {t('session:summary.pending')}
          </Text>
        </HStack>
        <Text variant="caption" color="text2">
          {t('session:summary.destNote')}
        </Text>
      </Card>

      <HStack gap="sm">
        <Box flex={1}>
          <Button
            testID={sessionIds.summaryBack}
            label={t('session:summary.back')}
            variant="secondary"
            fullWidth
            onPress={() => router.back()}
          />
        </Box>
        <Box flex={1}>
          <Button
            testID={sessionIds.summaryDiscard}
            label={discardArmed ? t('common:actions.confirmAgain') : t('session:summary.discard')}
            variant={discardArmed ? 'danger' : 'secondary'}
            fullWidth
            onPress={discard}
          />
        </Box>
      </HStack>
    </Screen>
  );
}

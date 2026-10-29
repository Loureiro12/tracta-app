import { useEffect, useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  HStack,
  ListGroup,
  ListRow,
  Pressable,
  Screen,
  Segmented,
  Stepper,
  Text,
  TextField,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { now, toDateKey } from '@/shared/clock';
import { useFeedbackStore } from '@/shared/feedback';
import { formatDate, useTranslation } from '@/shared/i18n';

import { useCreateChallenge } from '../api/useChallenges';
import { useFriends } from '../api/useFriends';
import { CheckSquare } from '../components/CheckSquare';
import { PeopleCard } from '../components/PeopleCard';
import { PersonRow } from '../components/PersonRow';
import { SheetHeader } from '../components/SheetHeader';
import { StepBar } from '../components/StepBar';
import { MIN_DURATION, challengeLengths } from '../model/social.constants';
import { challengeDates, firstName } from '../model/social.ranking';
import { socialRoutes } from '../model/social.routes';
import { useSocialStore } from '../model/social.store';
import { socialIds } from '../social.testids';

import type { ChallengeStart, ChallengeType } from '../model/social.types';
import type { ViewStyle } from 'react-native';

const TYPES: ChallengeType[] = ['day', 'minutes', 'steps'];
const SHORT_FMT = { day: 'numeric', month: 'short' } as const;

/** 4-step wizard: scoring type, duration, participants, review. */
export function NewChallengeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation('social');
  const showToast = useFeedbackStore((s) => s.showToast);
  const draft = useSocialStore((s) => s.draft);
  const startDraft = useSocialStore((s) => s.startDraft);
  const updateDraft = useSocialStore((s) => s.updateDraft);
  const toggleDraftMember = useSocialStore((s) => s.toggleDraftMember);
  const clearDraft = useSocialStore((s) => s.clearDraft);
  const friendsQuery = useFriends();
  const create = useCreateChallenge();
  const friends = friendsQuery.data;

  useEffect(() => {
    if (!draft && friends) startDraft(friends.map((f) => f.userId));
  }, [draft, friends, startDraft]);

  const option = useMemo(
    () => ({
      base: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outline,
        borderWidth: 1.5,
        borderRadius: theme.radii.xl,
        padding: theme.spacing.lg,
      } as ViewStyle,
      selected: { borderColor: theme.colors.ink } as ViewStyle,
      radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.outline,
        alignItems: 'center',
        justifyContent: 'center',
      } as ViewStyle,
      radioSelected: { borderColor: theme.colors.ink } as ViewStyle,
      length: {
        height: 64,
        borderRadius: theme.radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xxs,
        backgroundColor: theme.colors.surface,
      } as ViewStyle,
      lengthSelected: { backgroundColor: theme.colors.ink } as ViewStyle,
      footer: { borderTopWidth: 1, borderTopColor: theme.colors.divider } as ViewStyle,
    }),
    [theme],
  );

  if (!draft) return null;

  const { step } = draft;
  const { startDate, endDate } = challengeDates(now(), draft.start, draft.days);
  const people = friends ?? [];
  const members = people.filter((f) => draft.members.includes(f.userId));

  const onNext = () => {
    if (create.isPending) return;
    if (step === 3 && draft.members.length === 0) {
      showToast(t('newChallenge.pickFriend'));
      return;
    }
    if (step < 4) {
      updateDraft({ step: (step + 1) as 2 | 3 | 4 });
      return;
    }
    create.mutate(
      {
        name: draft.name.trim() || t('newChallenge.defaultName'),
        kind: draft.type,
        minValue: draft.type === 'day' ? draft.min : 0,
        days: draft.days,
        startsOn: toDateKey(startDate),
        memberIds: draft.members,
      },
      {
        onSuccess: (id) => {
          clearDraft();
          showToast(t('newChallenge.created'));
          router.replace(socialRoutes.challenge(id));
        },
        onError: () => showToast(t('actionError')),
      },
    );
  };

  return (
    <Screen
      testID={socialIds.newScreen}
      header={
        <SheetHeader
          testID={socialIds.newClose}
          title={t('newChallenge.title')}
          closeLabel={t('newChallenge.close')}
          onClose={() => router.back()}
        />
      }
      footer={
        <Box px="screen" pt="md" pb="3xl" style={option.footer}>
          <HStack gap="sm">
            {step > 1 ? (
              <Box flex={1}>
                <Button
                  testID={socialIds.newBack}
                  label={t('newChallenge.back')}
                  variant="surface"
                  size="lg"
                  fullWidth
                  onPress={() => updateDraft({ step: (step - 1) as 1 | 2 | 3 })}
                />
              </Box>
            ) : null}
            <Box flex={2}>
              <Button
                testID={socialIds.newNext}
                label={step < 4 ? t('newChallenge.next') : t('newChallenge.create')}
                size="lg"
                fullWidth
                onPress={onNext}
              />
            </Box>
          </HStack>
        </Box>
      }
    >
      <StepBar step={step} />

      {step === 1 ? (
        <VStack gap="sm">
          <Text testID={socialIds.newStepTitle} variant="nameTitle">
            {t('newChallenge.step1')}
          </Text>
          <VStack testID={socialIds.newTypes} gap="sm">
            {TYPES.map((type) => {
              const selected = draft.type === type;
              return (
                <Pressable
                  key={type}
                  testID={`${socialIds.newTypes}.${type}`}
                  onPress={() => updateDraft({ type })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[option.base, selected ? option.selected : null]}
                >
                  <HStack gap="md">
                    <Box flex={1} gap="xxs">
                      <Text variant="cardTitleSm">{t(`newChallenge.types.${type}.label`)}</Text>
                      <Text variant="secondary" color="text2">
                        {t(`newChallenge.types.${type}.desc`)}
                      </Text>
                    </Box>
                    <Box style={[option.radio, selected ? option.radioSelected : null]}>
                      {selected ? <Box bg="ink" style={styles.radioDot} /> : null}
                    </Box>
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
          {draft.type === 'day' ? (
            <Card radius="xl" padding="md" px="lg" gap="none">
              <HStack justify="space-between" gap="sm">
                <Box flex={1} gap="xxs">
                  <Text variant="bodySemibold">{t('newChallenge.min.label')}</Text>
                  <Text variant="caption" color="text2">
                    {t('newChallenge.min.desc')}
                  </Text>
                </Box>
                <Stepper
                  testID={socialIds.newMin}
                  valueLabel={t('newChallenge.min.value', { min: draft.min })}
                  decrementLabel={t('newChallenge.min.minus')}
                  incrementLabel={t('newChallenge.min.plus')}
                  onDecrement={() =>
                    updateDraft({ min: Math.max(MIN_DURATION.min, draft.min - MIN_DURATION.step) })
                  }
                  onIncrement={() =>
                    updateDraft({ min: Math.min(MIN_DURATION.max, draft.min + MIN_DURATION.step) })
                  }
                />
              </HStack>
            </Card>
          ) : null}
        </VStack>
      ) : null}

      {step === 2 ? (
        <VStack gap="md">
          <Text testID={socialIds.newStepTitle} variant="nameTitle">
            {t('newChallenge.step2')}
          </Text>
          <HStack testID={socialIds.newDays} gap="sm">
            {challengeLengths.map((n) => {
              const selected = draft.days === n;
              return (
                <Box key={n} flex={1}>
                  <Pressable
                    testID={`${socialIds.newDays}.${n}`}
                    onPress={() => updateDraft({ days: n })}
                    accessibilityState={{ selected }}
                    style={[option.length, selected ? option.lengthSelected : null]}
                  >
                    <Text variant="nameTitle" color={selected ? 'textOnInk' : 'text'} tabular>
                      {String(n)}
                    </Text>
                    <Text variant="caption" color={selected ? 'textOnInk' : 'text2'}>
                      {t('newChallenge.days')}
                    </Text>
                  </Pressable>
                </Box>
              );
            })}
          </HStack>
          <Text variant="secondarySemibold">{t('newChallenge.start')}</Text>
          <Segmented<ChallengeStart>
            testID={socialIds.newStart}
            value={draft.start}
            onChange={(start) => updateDraft({ start })}
            options={[
              { value: 'today', label: t('newChallenge.today') },
              { value: 'tomorrow', label: t('newChallenge.tomorrow') },
            ]}
          />
          <Text testID={socialIds.newRange} variant="small" color="text2">
            {t('newChallenge.range', {
              start: formatDate(startDate, SHORT_FMT),
              end: formatDate(endDate, SHORT_FMT),
              days: draft.days,
            })}
          </Text>
        </VStack>
      ) : null}

      {step === 3 ? (
        <VStack gap="md">
          <Text testID={socialIds.newStepTitle} variant="nameTitle">
            {t('newChallenge.step3')}
          </Text>
          <PeopleCard testID={socialIds.newPeople}>
            {people.map((f, i) => {
              const checked = draft.members.includes(f.userId);
              return (
                <Pressable
                  key={f.userId}
                  testID={`${socialIds.newPeople}.${f.key}`}
                  onPress={() => toggleDraftMember(f.userId)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={f.name}
                >
                  <PersonRow
                    name={f.name}
                    color={f.color}
                    minHeight={62}
                    last={i === people.length - 1}
                    trailing={<CheckSquare checked={checked} />}
                  />
                </Pressable>
              );
            })}
          </PeopleCard>
          <Text variant="caption" color="text2">
            {t('newChallenge.participantsNote')}
          </Text>
        </VStack>
      ) : null}

      {step === 4 ? (
        <VStack gap="md">
          <Text testID={socialIds.newStepTitle} variant="nameTitle">
            {t('newChallenge.step4')}
          </Text>
          <TextField
            testID={socialIds.newName}
            label={t('newChallenge.nameLabel')}
            placeholder={t('newChallenge.namePlaceholder')}
            value={draft.name}
            onChangeText={(name) => updateDraft({ name })}
          />
          <ListGroup testID={socialIds.newReview}>
            <ListRow
              testID={`${socialIds.newReview}.scoring`}
              label={t('newChallenge.review.scoring')}
              labelColor="text2"
              value={
                draft.type === 'day'
                  ? t('newChallenge.review.scoringDay', {
                      type: t('newChallenge.types.day.label'),
                      min: draft.min,
                    })
                  : t(`newChallenge.types.${draft.type}.label`)
              }
            />
            <ListRow
              testID={`${socialIds.newReview}.duration`}
              label={t('newChallenge.review.duration')}
              labelColor="text2"
              value={t('newChallenge.review.durationValue', { days: draft.days })}
            />
            <ListRow
              testID={`${socialIds.newReview}.period`}
              label={t('newChallenge.review.period')}
              labelColor="text2"
              value={t('newChallenge.review.periodValue', {
                start: formatDate(startDate, SHORT_FMT),
                end: formatDate(endDate, SHORT_FMT),
              })}
            />
            <ListRow
              testID={`${socialIds.newReview}.participants`}
              label={t('newChallenge.review.participants')}
              labelColor="text2"
              value={t('newChallenge.review.participantsValue', {
                names: members.map((m) => firstName(m.name)).join(', '),
              })}
              last
            />
          </ListGroup>
          <Box bg="brandTint" radius="md" px="ml" py="md">
            <Text variant="secondary" color="brandText">
              {t('newChallenge.note')}
            </Text>
          </Box>
        </VStack>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  radioDot: { width: 12, height: 12, borderRadius: 6 },
});

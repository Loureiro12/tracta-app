import { useRouter } from 'expo-router';

import { BackHeader, Box, Button, Card, HStack, Screen, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useEndEnrollment, useEnroll, useEnrollment, usePrograms } from '../api/usePrograms';
import { QueryState } from '../components/QueryState';
import { dayKey } from '../model/workouts.days';
import { workoutsRoutes } from '../model/workouts.routes';
import { workoutsIds as ids } from '../workouts.testids';

import type { SemanticColors } from '@tracta/design-system';

function weekColor(current: boolean, light: boolean): keyof SemanticColors {
  if (current) return 'brandText';
  return light ? 'warnText' : 'text';
}

function dayTone(p: string): { bg: keyof SemanticColors; fg: keyof SemanticColors } {
  if (p === '—') return { bg: 'fill2', fg: 'text3' };
  if (p === '⟶') return { bg: 'run', fg: 'textOnBrand' };
  return { bg: 'brand', fg: 'textOnBrand' };
}

/** Programs overlay: catalog list, or the detail of `id` with its typical week and weeks plan. */
export function ProgramsScreen({ id }: { id?: string | undefined }) {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const catalog = usePrograms();
  const { data: activeProgram } = useEnrollment();
  const enroll = useEnroll();
  const endEnrollment = useEndEnrollment();
  const programs = catalog.data ?? [];
  const program = programs.find((p) => p.id === id) ?? null;
  const isActive = Boolean(program && activeProgram?.id === program.id);
  const currentWeek = isActive ? (activeProgram?.week ?? 1) - 1 : -1;

  const header = (
    <BackHeader
      testID={ids.programsBack}
      label={program && !isActive ? t('programs.backPrograms') : t('programs.backWorkouts')}
      onPress={() => router.back()}
    />
  );

  if (!program) {
    return (
      <Screen testID={ids.programsScreen} header={header}>
        <VStack gap="xs">
          <Text testID={ids.programsTitle} variant="overlayTitle">
            {t('programs.title')}
          </Text>
          <Text color="text2">{t('programs.intro')}</Text>
        </VStack>
        <QueryState
          testID={ids.programsList}
          loading={catalog.isLoading}
          error={catalog.error}
          onRetry={() => void catalog.refetch()}
        />
        <VStack testID={ids.programsList} gap="md">
          {programs.map((p) => (
            <Card
              key={p.id}
              testID={`${ids.programsList}.${p.id}`}
              onPress={() => router.push(workoutsRoutes.programs(p.id))}
              gap="sm"
            >
              <HStack justify="space-between" gap="sm">
                <Text variant="caption" color="text2" numberOfLines={1}>
                  {p.tag}
                </Text>
                <Text variant="caption" color="text2" numberOfLines={1}>
                  {t('programs.per', { frequency: p.frequency, count: p.weeks })}
                </Text>
              </HStack>
              <Text variant="nameTitle">{p.name}</Text>
              <Text variant="secondary" color="text2">
                {p.description}
              </Text>
            </Card>
          ))}
        </VStack>
      </Screen>
    );
  }

  const act = () => {
    if (enroll.isPending || endEnrollment.isPending) return;
    const onError = () => showToast(t('toast.saveFailed'));
    if (isActive) {
      endEnrollment.mutate(undefined, {
        onSuccess: () => {
          showToast(t('toast.programEnded'));
          router.dismissTo(workoutsRoutes.tab());
        },
        onError,
      });
    } else {
      enroll.mutate(program.id, {
        onSuccess: () => {
          showToast(t('toast.programStarted', { name: program.name }));
          router.dismissTo(workoutsRoutes.tab());
        },
        onError,
      });
    }
  };

  return (
    <Screen testID={ids.programsScreen} header={header}>
      <VStack gap="xs">
        <Text variant="captionBold" color="brandText" uppercase>
          {t('programs.tagWeeks', { tag: program.tag, count: program.weeks })}
        </Text>
        <Text testID={ids.programTitle} variant="heroMd">
          {program.name}
        </Text>
        <Text color="text2">{program.description}</Text>
      </VStack>
      <Card padding="lg" gap="sm">
        <Text variant="bodySemibold">{t('programs.typicalWeek')}</Text>
        <HStack testID={ids.programWeek} gap="xs" align="stretch">
          {program.pattern.map((p, i) => {
            const tone = dayTone(p);
            return (
              <Box
                key={i}
                testID={`${ids.programWeek}.${i}`}
                flex={1}
                radius="sm"
                py="sm"
                align="center"
                gap="xs"
                bg={tone.bg}
              >
                <Text variant="captionSemibold" color={tone.fg}>
                  {t(dayKey(i))}
                </Text>
                <Text variant="smallBold" color={tone.fg}>
                  {p}
                </Text>
              </Box>
            );
          })}
        </HStack>
        <Text variant="caption" color="text2">
          {program.legend}
        </Text>
      </Card>
      <Box testID={ids.programWeeks} bg="surface" radius="card" px="xl" py="xs">
        {program.weekTitles.map((title, i) => {
          const current = i === currentWeek;
          const light = program.lightWeeks.includes(i);
          const color = weekColor(current, light);
          return (
            <HStack
              key={i}
              testID={`${ids.programWeeks}.${i}`}
              gap="sm"
              borderColor="divider"
              style={i === program.weekTitles.length - 1 ? styles.rowLast : styles.row}
            >
              <Box style={styles.weekLabel}>
                <Text variant="secondaryBold" color={color}>
                  {t('programs.week', { n: i + 1 })}
                </Text>
              </Box>
              <Box flex={1}>
                <Text variant="small">{title}</Text>
              </Box>
              <Text variant="captionBold" color={color}>
                {current ? t('programs.current') : light ? t('programs.light') : ''}
              </Text>
            </HStack>
          );
        })}
      </Box>
      <Text variant="caption" color="text2">
        {t('programs.note')}
      </Text>
      <Button
        testID={ids.programCta}
        label={
          isActive ? t('programs.end') : activeProgram ? t('programs.switch') : t('programs.start')
        }
        variant={isActive ? 'dangerText' : 'primary'}
        size="lg"
        fullWidth
        onPress={act}
      />
    </Screen>
  );
}

const styles = {
  row: { minHeight: 50, borderBottomWidth: 1 } as const,
  rowLast: { minHeight: 50 } as const,
  weekLabel: { width: 72 } as const,
};

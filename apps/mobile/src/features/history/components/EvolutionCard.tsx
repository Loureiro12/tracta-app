import { useMemo } from 'react';

import { ScrollView, StyleSheet } from 'react-native';

import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Box, Card, Chip, HStack, Segmented, Text, VStack, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { InkSegmented } from './InkSegmented';
import { PrTag } from './PrTag';
import { QueryState } from './QueryState';
import { useEvolution } from '../api/useHistory';
import { historyIds as ids } from '../history.testids';
import { formatShortDate } from '../lib/dates';
import { clock, decimal, kg, signed, thousands } from '../lib/format';
import { itemId } from '../lib/ids';
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  cardioEvolution,
  strengthEvolution,
} from '../model/history.evolution';
import { useHistoryStore } from '../model/history.store';

import type {
  CardioGroup,
  CardioMetric,
  ChartPoint,
  EvoKind,
  StrengthMetric,
} from '../model/history.types';
import type { ViewStyle } from 'react-native';

const CARDIO_GROUPS: readonly CardioGroup[] = ['all', '5k', 'long'];
const CARDIO_METRICS: readonly CardioMetric[] = ['pace', 'dist', 'hr'];
const GRID_LINES = [20, 65, 110];

type ViewModel = {
  heading: string;
  count: string;
  chips: readonly { id: string; label: string; selected: boolean; onPress: () => void }[];
  metricOptions: readonly { value: string; label: string }[];
  metricValue: string;
  onMetric: (value: string) => void;
  big: string;
  bigSub: string;
  geometry: { line: string; area: string; cx: number; cy: number };
  x0: string;
  x1: string;
  best: string;
  deltaLabel: string;
  delta: string;
  recent: readonly { date: string; value: string; pr: boolean }[];
  note: string;
};

/** "Evolução por exercício / do cardio": kind toggle, chips, metric, line chart, best/delta, recent. */
export function EvolutionCard() {
  const { t } = useTranslation('history');
  const theme = useTheme();
  const kind = useHistoryStore((s) => s.evoKind);
  const exerciseSlug = useHistoryStore((s) => s.evoExercise);
  const metric = useHistoryStore((s) => s.evoMetric);
  const group = useHistoryStore((s) => s.cardioGroup);
  const cardioMetric = useHistoryStore((s) => s.cardioMetric);
  const evolution = useEvolution();
  const data = evolution.data;
  const setKind = useHistoryStore((s) => s.setEvoKind);
  const setExercise = useHistoryStore((s) => s.setEvoExercise);
  const setMetric = useHistoryStore((s) => s.setEvoMetric);
  const setGroup = useHistoryStore((s) => s.setCardioGroup);
  const setCardioMetric = useHistoryStore((s) => s.setCardioMetric);

  const shortDate = formatShortDate;
  const recentOf = (points: readonly ChartPoint[], fmt: (v: number) => string) =>
    points
      .slice(-4)
      .reverse()
      .map((p) => ({ date: shortDate(p.date), value: fmt(p.value), pr: p.pr }));

  const vm = useMemo<ViewModel | null>(() => {
    if (!data) return null;
    if (kind === 'strength') {
      const evo = strengthEvolution(data.exercises, exerciseSlug, metric);
      if (!evo) return null;
      const m = evo.metric;
      const fmt = (v: number) =>
        m === 'kg'
          ? `${kg(v)} kg`
          : m === 'vol'
            ? `${thousands(v)} ${evo.bodyweight ? 'reps' : 'kg'}`
            : `${v} reps`;
      const first = evo.points[0]!;
      const last = evo.points[evo.points.length - 1]!;
      return {
        heading: t('evo.strengthHeading'),
        count: t('evo.sessions', { count: evo.points.length }),
        chips: data.exercises.map((e) => ({
          id: e.slug,
          label: e.name,
          selected: e.slug === evo.slug,
          onPress: () => setExercise(e.slug),
        })),
        metricOptions: evo.metrics.map((k) => ({
          value: k,
          label: k === 'reps' && evo.bodyweight ? t('evo.metric.repsMax') : t(`evo.metric.${k}`),
        })),
        metricValue: m,
        onMetric: (v) => setMetric(v as StrengthMetric),
        big: fmt(last.value),
        bigSub: t('evo.last', { date: shortDate(last.date) }),
        geometry: evo.geometry,
        x0: shortDate(first.date),
        x1: shortDate(last.date),
        best: evo.bodyweight
          ? t('evo.bestReps', { reps: evo.best.reps, date: shortDate(evo.best.date) })
          : t('evo.bestKg', {
              kg: kg(evo.best.kg ?? 0),
              reps: evo.best.reps,
              date: shortDate(evo.best.date),
            }),
        deltaLabel: t('evo.since', { date: shortDate(first.date) }),
        delta: t('evo.deltaStrength', {
          delta: signed(evo.delta, fmt(Math.abs(evo.delta))),
          pct: `${evo.deltaPct >= 0 ? '+' : ''}${evo.deltaPct}`,
        }),
        recent: recentOf(evo.points, fmt),
        note: t('evo.noteStrength'),
      };
    }
    const evo = cardioEvolution(data.runs, group, cardioMetric);
    const m = evo.metric;
    const fmt = (v: number) =>
      m === 'pace' ? `${clock(v)} /km` : m === 'dist' ? `${decimal(v)} km` : `${Math.round(v)} bpm`;
    const first = evo.points[0];
    const last = evo.points[evo.points.length - 1];
    const base = {
      heading: t('evo.cardioHeading'),
      count: t('evo.runs', { count: evo.points.length }),
      chips: CARDIO_GROUPS.map((g) => ({
        id: g,
        label: t(`evo.group.${g}`),
        selected: g === evo.group,
        onPress: () => setGroup(g),
      })),
      metricOptions: CARDIO_METRICS.map((k) => ({ value: k, label: t(`evo.metric.${k}`) })),
      metricValue: m,
      onMetric: (v: string) => setCardioMetric(v as CardioMetric),
      recent: recentOf(evo.points, fmt),
    };
    if (!evo.enough || !first || !last) {
      return {
        ...base,
        big: first ? fmt(first.value) : '—',
        bigSub: t('evo.fewRecords'),
        geometry: evo.geometry,
        x0: '',
        x1: '',
        best: '—',
        deltaLabel: t('evo.variation'),
        delta: '—',
        note: t('evo.noteFew'),
      };
    }
    const best = evo.best ?? last;
    const bestText = t('evo.bestValue', { value: fmt(best.value), date: shortDate(best.date) });
    const dv = evo.delta;
    return {
      ...base,
      big: fmt(last.value),
      bigSub: t('evo.last', { date: shortDate(last.date) }),
      geometry: evo.geometry,
      x0: shortDate(first.date),
      x1: shortDate(last.date),
      best:
        m === 'hr'
          ? t('evo.bestLowest', { value: fmt(best.value), date: shortDate(best.date) })
          : bestText,
      deltaLabel: t('evo.since', { date: shortDate(first.date) }),
      delta:
        m === 'pace'
          ? dv <= 0
            ? t('evo.fasterBy', { time: clock(-dv) })
            : t('evo.slowerBy', { time: clock(dv) })
          : m === 'dist'
            ? signed(dv, `${decimal(Math.abs(dv))} km`)
            : signed(dv, `${Math.abs(Math.round(dv))} bpm`),
      note: m === 'pace' ? t('evo.notePace') : m === 'hr' ? t('evo.noteHr') : t('evo.noteDist'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, kind, exerciseSlug, metric, group, cardioMetric, t]);

  const dividerStyle = useMemo<ViewStyle>(
    () => ({
      borderTopWidth: 1,
      borderTopColor: theme.colors.dividerStrong,
      paddingTop: theme.spacing.md,
    }),
    [theme],
  );
  const recentRowStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 40,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    }),
    [theme],
  );

  if (!data) {
    return (
      <QueryState
        testID={ids.evoCard}
        error={evolution.isError}
        onRetry={() => void evolution.refetch()}
      />
    );
  }
  if (!vm) return null;
  const c = theme.colors;
  const kindOptions: { value: EvoKind; label: string }[] = [
    { value: 'strength', label: t('evo.kind.strength') },
    { value: 'cardio', label: t('evo.kind.cardio') },
  ];

  return (
    <Card testID={ids.evoCard} padding="none" py="xl" gap="ml">
      <HStack justify="space-between" align="baseline" gap="sm" px="xl">
        <Text testID={ids.evoHeading} variant="bodySemibold" numberOfLines={1}>
          {vm.heading}
        </Text>
        <Text testID={ids.evoCount} variant="caption" color="text2" numberOfLines={1}>
          {vm.count}
        </Text>
      </HStack>
      <Box px="xl">
        <InkSegmented testID={ids.evoKind} options={kindOptions} value={kind} onChange={setKind} />
      </Box>
      <ScrollView
        testID={ids.evoChips}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {vm.chips.map((chip) => (
          <Chip
            key={chip.id}
            testID={`${ids.evoChips}.${chip.id}`}
            label={chip.label}
            selected={chip.selected}
            onPress={chip.onPress}
          />
        ))}
      </ScrollView>
      <VStack px="xl" gap="md">
        <Segmented
          testID={ids.evoMetric}
          options={vm.metricOptions}
          value={vm.metricValue}
          onChange={vm.onMetric}
        />
        <HStack align="baseline" gap="sm" pt="xs">
          <Text testID={ids.evoBig} variant="heroMd" tabular numberOfLines={1}>
            {vm.big}
          </Text>
          <Text testID={ids.evoBigSub} variant="secondary" color="text2" numberOfLines={1}>
            {vm.bigSub}
          </Text>
        </HStack>
        <Svg
          testID={ids.evoChart}
          width="100%"
          height={CHART_HEIGHT}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          {GRID_LINES.map((y) => (
            <Line
              key={y}
              x1={0}
              y1={y}
              x2={CHART_WIDTH}
              y2={y}
              stroke={c.divider}
              strokeWidth={1}
            />
          ))}
          {vm.geometry.area ? (
            <Path d={vm.geometry.area} fill={c.success} fillOpacity={0.12} />
          ) : null}
          {vm.geometry.line ? (
            <Path
              d={vm.geometry.line}
              fill="none"
              stroke={c.brandText}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          ) : null}
          <Circle
            cx={vm.geometry.cx}
            cy={vm.geometry.cy}
            r={5}
            fill={c.brand}
            stroke={c.surface}
            strokeWidth={3}
          />
        </Svg>
        <HStack justify="space-between">
          <Text variant="micro" color="text3">
            {vm.x0}
          </Text>
          <Text variant="micro" color="text3">
            {vm.x1}
          </Text>
        </HStack>
        <HStack gap="md" align="flex-start" style={dividerStyle}>
          <VStack flex={1} gap="xxs">
            <Text variant="caption" color="text2">
              {t('evo.best')}
            </Text>
            <Text testID={ids.evoBest} variant="subtitle" numberOfLines={1}>
              {vm.best}
            </Text>
          </VStack>
          <VStack flex={1} gap="xxs">
            <Text variant="caption" color="text2" numberOfLines={1}>
              {vm.deltaLabel}
            </Text>
            <Text testID={ids.evoDelta} variant="subtitle" numberOfLines={1}>
              {vm.delta}
            </Text>
          </VStack>
        </HStack>
        <VStack testID={ids.evoRecent} gap="none" style={dividerStyle}>
          <Text variant="caption" color="text2">
            {t('evo.recent')}
          </Text>
          {vm.recent.map((row, i) => {
            const rowId = itemId(ids.evoRecent, i);
            return (
              <Box key={i} testID={rowId} style={recentRowStyle}>
                <HStack gap="sm">
                  <Text testID={`${rowId}.date`} variant="small">
                    {row.date}
                  </Text>
                  {row.pr ? <PrTag testID={`${rowId}.pr`} /> : null}
                </HStack>
                <Text testID={`${rowId}.value`} variant="smallSemibold" tabular>
                  {row.value}
                </Text>
              </Box>
            );
          })}
        </VStack>
        <Text testID={ids.evoNote} variant="caption" color="text2">
          {vm.note}
        </Text>
      </VStack>
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: 18, gap: 6 },
});

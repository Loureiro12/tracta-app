import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Button, HStack, Sheet, Text, VStack } from '@tracta/design-system';

import { today } from '@/shared/clock';
import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useLatestBody, useLogBody } from '../api/useBody';
import { StepperField } from '../components/StepperField';
import { healthIds as ids } from '../health.testids';

import type { body } from '@tracta/api';

type Field = 'weight' | 'waist' | 'hip' | 'arm';
const STEP: Record<Field, number> = { weight: 0.1, waist: 0.5, hip: 0.5, arm: 0.5 };
const FIELDS = [
  {
    key: 'weight',
    id: ids.bodyLogWeight,
    labelKey: 'bodyLog.weight',
    unitKey: 'bodyLog.weightUnit',
  },
  { key: 'waist', id: ids.bodyLogWaist, labelKey: 'body.measure.waist', unitKey: 'bodyLog.cm' },
  { key: 'hip', id: ids.bodyLogHip, labelKey: 'body.measure.hip', unitKey: 'bodyLog.cm' },
  { key: 'arm', id: ids.bodyLogArm, labelKey: 'body.measure.arm', unitKey: 'bodyLog.cm' },
] as const;
const [WEIGHT_FIELD, ...MEASURE_FIELDS] = FIELDS;

const fmt = (v: number) => String(Math.round(v * 10) / 10);
const fmtOpt = (v: number | undefined) => (v === undefined ? '' : fmt(v));

function draftOf(latest: body.LatestBody | undefined): Record<Field, string> {
  return {
    weight: fmtOpt(latest?.weight?.value),
    waist: fmtOpt(latest?.waist?.value),
    hip: fmtOpt(latest?.hip?.value),
    arm: fmtOpt(latest?.arm?.value),
  };
}
const parse = (s: string) => Number.parseFloat(s.replace(',', '.'));

/** "Registrar · hoje" sheet: weight + optional measurements, saved as a manual entry. */
export function BodyLogSheetScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const latest = useLatestBody().data;
  const logBody = useLogBody();

  // Prefilled with the latest values (also when they arrive after the sheet opened); edits override.
  const [edits, setEdits] = useState<Partial<Record<Field, string>>>({});
  const draft: Record<Field, string> = { ...draftOf(latest), ...edits };
  const setField = (field: Field, value: string) => setEdits((e) => ({ ...e, [field]: value }));
  const adjust = (field: Field, dir: 1 | -1) => {
    setEdits((e) => {
      const d = { ...draftOf(latest), ...e };
      const current = parse(d[field]);
      const base = Number.isFinite(current) ? current : 0;
      return { ...e, [field]: fmt(Math.max(0, base + dir * STEP[field])) };
    });
  };
  const valid = Number.isFinite(parse(draft.weight)) && parse(draft.weight) > 0;

  const save = () => {
    if (logBody.isPending) return;
    const value = (field: Field) => {
      const v = parse(draft[field]);
      return Number.isFinite(v) && v > 0 ? v : undefined;
    };
    const input: body.LogBodyInput = { measuredOn: today() };
    const weight = value('weight');
    if (weight !== undefined) input.weightKg = weight;
    const waist = value('waist');
    if (waist !== undefined) input.waistCm = waist;
    const hip = value('hip');
    if (hip !== undefined) input.hipCm = hip;
    const arm = value('arm');
    if (arm !== undefined) input.armCm = arm;
    logBody.mutate(input, {
      onSuccess: () => {
        showToast(t('bodyLog.saved'));
        router.back();
      },
      onError: () => showToast(t('bodyLog.saveError')),
    });
  };

  const field = ({ key, id, labelKey, unitKey }: (typeof FIELDS)[number]) => (
    <StepperField
      key={key}
      testID={id}
      label={t(labelKey)}
      value={draft[key]}
      onChangeText={(v) => setField(key, v)}
      onDecrement={() => adjust(key, -1)}
      onIncrement={() => adjust(key, 1)}
      decrementLabel={t('bodyLog.decrement')}
      incrementLabel={t('bodyLog.increment')}
      unit={t(unitKey)}
    />
  );

  return (
    <Sheet
      testID={ids.bodyLogSheet}
      title={t('bodyLog.title')}
      leftLabel={t('bodyLog.cancel')}
      onClose={() => router.back()}
      footer={
        <VStack gap="sm">
          <Button
            testID={ids.bodyLogSave}
            label={t('bodyLog.save')}
            size="lg"
            fullWidth
            disabled={!valid || logBody.isPending}
            onPress={save}
          />
          <Text variant="caption" color="text2" align="center">
            {t('bodyLog.note')}
          </Text>
        </VStack>
      }
    >
      {field(WEIGHT_FIELD)}
      <Text variant="secondarySemibold">{t('bodyLog.measures')}</Text>
      <HStack gap="sm" align="stretch">
        {MEASURE_FIELDS.map(field)}
      </HStack>
    </Sheet>
  );
}

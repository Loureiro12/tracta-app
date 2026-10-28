import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Button, HStack, Sheet, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { StepperField } from '../components/StepperField';
import { healthIds as ids } from '../health.testids';
import { latestMeasures, weightPoints } from '../lib/derive';
import { TODAY_DAY } from '../model/health.mock';
import { useHealthStore } from '../model/health.store';

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
const parse = (s: string) => Number.parseFloat(s.replace(',', '.'));

/** "Registrar · hoje" sheet: weight + optional measurements, saved as a manual entry. */
export function BodyLogSheetScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const bodyLogs = useHealthStore((s) => s.bodyLogs);
  const addBodyLog = useHealthStore((s) => s.addBodyLog);

  const [draft, setDraft] = useState<Record<Field, string>>(() => {
    const points = weightPoints(bodyLogs);
    const m = latestMeasures(bodyLogs);
    return {
      weight: fmt(points[points.length - 1]?.weight ?? 0),
      waist: fmt(m.waist),
      hip: fmt(m.hip),
      arm: fmt(m.arm),
    };
  });
  const setField = (field: Field, value: string) => setDraft((d) => ({ ...d, [field]: value }));
  const adjust = (field: Field, dir: 1 | -1) =>
    setDraft((d) => {
      const current = parse(d[field]);
      const base = Number.isFinite(current) ? current : 0;
      return { ...d, [field]: fmt(Math.max(0, base + dir * STEP[field])) };
    });
  const valid = Number.isFinite(parse(draft.weight)) && parse(draft.weight) > 0;

  const save = () => {
    const n = (field: Field) => {
      const v = parse(draft[field]);
      return Number.isFinite(v) ? v : 0;
    };
    addBodyLog({
      day: TODAY_DAY,
      weight: n('weight'),
      waist: n('waist'),
      hip: n('hip'),
      arm: n('arm'),
    });
    showToast(t('bodyLog.saved'));
    router.back();
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
            disabled={!valid}
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

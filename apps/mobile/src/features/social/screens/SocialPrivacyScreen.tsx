import { useRouter } from 'expo-router';

import { ListGroup, ListRow, Sheet, Switch, Text } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { usePrivacy, useSetPrivacy } from '../api/usePrivacy';
import { socialIds } from '../social.testids';

import type { PrivacyKey } from '../model/social.types';

const ROWS: PrivacyKey[] = ['done', 'kind', 'streak', 'loads', 'prs'];

/** "What your friends see" sheet: per-item switches; loads and records are off by default. */
export function SocialPrivacySheet() {
  const router = useRouter();
  const { t } = useTranslation('social');
  const showToast = useFeedbackStore((s) => s.showToast);
  const privacy = usePrivacy();
  const update = useSetPrivacy();
  const setPrivacy = (key: PrivacyKey, value: boolean) =>
    update.mutate({ key, value }, { onError: () => showToast(t('actionError')) });

  return (
    <Sheet
      testID={socialIds.privacyScreen}
      title={t('privacy.title')}
      rightLabel={t('privacy.close')}
      onClose={() => router.back()}
    >
      <Text variant="small" color="text2">
        {t('privacy.intro')}
      </Text>
      <ListGroup testID={socialIds.privacyRows}>
        {ROWS.map((key) => {
          const locked = key === 'done';
          return (
            <ListRow
              key={key}
              testID={`${socialIds.privacyRows}.${key}`}
              label={t(`privacy.rows.${key}.label`)}
              description={t(`privacy.rows.${key}.desc`)}
              last={key === 'prs'}
              onPress={() =>
                locked ? showToast(t('privacy.locked')) : setPrivacy(key, !privacy[key])
              }
              trailing={
                <Switch
                  testID={`${socialIds.privacyRows}.${key}.switch`}
                  value={privacy[key]}
                  disabled={locked}
                  onValueChange={(value) => setPrivacy(key, value)}
                  accessibilityLabel={t(`privacy.rows.${key}.label`)}
                />
              }
            />
          );
        })}
      </ListGroup>
      <Text variant="caption" color="text2">
        {t('privacy.note')}
      </Text>
    </Sheet>
  );
}

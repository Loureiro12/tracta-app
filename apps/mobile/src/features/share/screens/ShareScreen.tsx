import { useCallback, useEffect, useMemo } from 'react';

import { ScrollView, StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Box,
  Button,
  HStack,
  IconButton,
  Pressable,
  Screen,
  Segmented,
  Text,
  useTheme,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { OptionToggle } from '../components/OptionToggle';
import { ShareCard } from '../components/ShareCard';
import { ShareTarget } from '../components/ShareTarget';
import { StyleSwatch } from '../components/StyleSwatch';
import { useShareCardContent } from '../hooks/useShareCardContent';
import {
  isShareStyle,
  isShareTemplate,
  shareFormats,
  shareOptions,
  shareStyles,
  shareTargets,
  shareTemplates,
  userMock,
} from '../model/share.mock';
import { useShareStore } from '../model/share.store';
import { shareIds } from '../share.testids';

import type {
  ShareFormat,
  ShareOption,
  ShareStyle,
  ShareTarget as ShareTargetKey,
  ShareTemplate,
} from '../model/share.mock';
import type { ViewStyle } from 'react-native';

const templateIds: Record<ShareTemplate, string> = {
  today: shareIds.templateToday,
  evo: shareIds.templateEvo,
  pr: shareIds.templatePr,
  week: shareIds.templateWeek,
  run: shareIds.templateRun,
  month: shareIds.templateMonth,
};
const styleIds: Record<ShareStyle, string> = {
  ink: shareIds.styleInk,
  sand: shareIds.styleSand,
  brand: shareIds.styleBrand,
  photo: shareIds.stylePhoto,
};
const optionIds: Record<ShareOption, string> = {
  loads: shareIds.optionLoads,
  times: shareIds.optionTimes,
  name: shareIds.optionName,
};
const targetIds: Record<ShareTargetKey, string> = {
  stories: shareIds.targetStories,
  whatsapp: shareIds.targetWhatsapp,
  save: shareIds.targetSave,
  more: shareIds.targetMore,
};

export type ShareScreenProps = {
  /** `?template=today|evo|pr|week|run|month` */
  template?: string | undefined;
  /** `?style=ink|sand|brand|photo` */
  style?: string | undefined;
};

/** "Compartilhar progresso": card preview with template arrows, styles, format, options and destinations. */
export function ShareScreen({ template: templateParam, style: styleParam }: ShareScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('share');
  const showToast = useFeedbackStore((s) => s.showToast);

  const template = useShareStore((s) => s.template);
  const style = useShareStore((s) => s.style);
  const format = useShareStore((s) => s.format);
  const options = useShareStore((s) => s.options);
  const setTemplate = useShareStore((s) => s.setTemplate);
  const stepTemplate = useShareStore((s) => s.stepTemplate);
  const setStyle = useShareStore((s) => s.setStyle);
  const setFormat = useShareStore((s) => s.setFormat);
  const toggleOption = useShareStore((s) => s.toggleOption);

  // Entry points pass the template/style in the href (nudge, history, achievements, recap).
  useEffect(() => {
    if (isShareTemplate(templateParam)) setTemplate(templateParam);
    if (isShareStyle(styleParam)) setStyle(styleParam);
  }, [templateParam, styleParam, setTemplate, setStyle]);

  const content = useShareCardContent(template, options);
  const handle = t('card.handle', { name: userMock.handle });

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const exportCard = useCallback(() => {
    showToast(t('exported'));
  }, [showToast, t]);

  const formatOptions = useMemo(
    () => shareFormats.map((value) => ({ value, label: t(`formats.${value}`) })),
    [t],
  );

  const panelStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radii.sheet,
      borderTopRightRadius: theme.radii.sheet,
      paddingTop: theme.spacing.ml,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: Math.max(insets.bottom, 30),
      gap: theme.spacing.md,
    }),
    [theme, insets.bottom],
  );

  return (
    <Screen
      testID={shareIds.screen}
      scroll={false}
      padded={false}
      header={
        <HStack px="md" gap="none" style={styles.header}>
          <Box flex={1} align="flex-start">
            <Pressable
              testID={shareIds.close}
              onPress={close}
              accessibilityLabel={t('close')}
              style={styles.closeButton}
            >
              <Text variant="bodySemibold" color="text2">
                {t('close')}
              </Text>
            </Pressable>
          </Box>
          <Text testID={shareIds.title} variant="cardTitleSm" accessibilityRole="header">
            {t('title')}
          </Text>
          <Box flex={1} />
        </HStack>
      }
      footer={
        <Box style={panelStyle}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.templatesStrip}
            contentContainerStyle={styles.templatesContent}
          >
            {shareTemplates.map((key) => (
              <Button
                key={key}
                testID={templateIds[key]}
                label={t(`templates.${key}`)}
                size="xs"
                variant={key === template ? 'primary' : 'secondary'}
                onPress={() => setTemplate(key)}
              />
            ))}
          </ScrollView>

          <HStack justify="space-between" gap="sm">
            <HStack gap="sm">
              {shareStyles.map((key) => (
                <StyleSwatch
                  key={key}
                  testID={styleIds[key]}
                  style={key}
                  selected={key === style}
                  label={t(`styles.${key}`)}
                  {...(key === 'photo' ? { badge: t('styles.photoBadge') } : {})}
                  onPress={() => setStyle(key)}
                />
              ))}
            </HStack>
            <Box style={styles.formats}>
              <Segmented<ShareFormat>
                testID={shareIds.format}
                options={formatOptions}
                value={format}
                onChange={setFormat}
              />
            </Box>
          </HStack>

          <HStack gap="sm" wrap="wrap">
            {shareOptions.map((key) => (
              <OptionToggle
                key={key}
                testID={optionIds[key]}
                label={t(`options.${key}`)}
                checked={options[key]}
                onPress={() => toggleOption(key)}
              />
            ))}
          </HStack>

          <HStack gap="sm" align="flex-start" pt="xxs">
            {shareTargets.map((key) => (
              <ShareTarget
                key={key}
                testID={targetIds[key]}
                target={key}
                label={t(`targets.${key}`)}
                onPress={exportCard}
              />
            ))}
          </HStack>
        </Box>
      }
    >
      <HStack flex={1} justify="center" gap="sm" pb="sm">
        <IconButton
          testID={shareIds.prev}
          icon="chevron-left"
          label={t('nav.prev')}
          size={36}
          onPress={() => stepTemplate(-1)}
        />
        <ShareCard
          content={content}
          style={style}
          format={format}
          showName={options.name}
          handle={handle}
        />
        <IconButton
          testID={shareIds.next}
          icon="chevron-right"
          label={t('nav.next')}
          size={36}
          onPress={() => stepTemplate(1)}
        />
      </HStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 48 },
  closeButton: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  templatesStrip: { marginHorizontal: -16 },
  templatesContent: { paddingHorizontal: 16, gap: 6 },
  formats: { width: 140 },
});

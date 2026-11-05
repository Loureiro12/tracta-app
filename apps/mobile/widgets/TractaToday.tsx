import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  lineLimit,
  privacySensitive,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import type { TodayWidgetProps } from '@/shared/widgets';
import type { WidgetEnvironment } from 'expo-widgets';

/** Small: today's workout (or the rest day). Lock Screen: the line above the clock. */
function TractaToday(props: TodayWidgetProps, env: WidgetEnvironment) {
  'widget';
  if (env.widgetFamily === 'accessoryInline') {
    return (
      <Text modifiers={[widgetURL(props.url)]}>
        {`Tracta · ${props.signedIn ? props.inline : props.signedOutText}`}
      </Text>
    );
  }

  const dark = env.colorScheme === 'dark';
  const c = dark
    ? { bg: '#141412', ink: '#F2EEE6', text2: '#CFCBBE', brand: '#F0A487' }
    : { bg: '#F2EEE6', ink: '#1A1A17', text2: '#6B6A63', brand: '#B4482A' };

  if (!props.signedIn) {
    return (
      <VStack modifiers={[containerBackground(c.bg, 'widget'), widgetURL(props.url)]}>
        <Text modifiers={[font({ family: 'Archivo100-Bold', size: 15 }), foregroundStyle(c.ink)]}>
          {props.signedOutText}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={2}
      modifiers={[containerBackground(c.bg, 'widget'), widgetURL(props.url)]}
    >
      <HStack>
        <Text modifiers={[font({ family: 'Archivo100-Bold', size: 12 }), foregroundStyle(c.brand)]}>
          {props.heading}
        </Text>
        <Spacer />
        <Text
          modifiers={[font({ family: 'Archivo100-SemiBold', size: 11 }), foregroundStyle(c.text2)]}
        >
          {props.time}
        </Text>
      </HStack>
      <Spacer />
      {props.badge ? (
        <Text
          modifiers={[font({ family: 'Archivo70-ExtraBold', size: 36 }), foregroundStyle(c.brand)]}
        >
          {props.badge}
        </Text>
      ) : null}
      <Text
        modifiers={[
          font({ family: 'Archivo100-Bold', size: 15 }),
          foregroundStyle(c.ink),
          lineLimit(2),
        ]}
      >
        {props.title}
      </Text>
      <Text
        modifiers={[
          font({ family: 'Archivo100-Regular', size: 11 }),
          foregroundStyle(c.text2),
          lineLimit(1),
          privacySensitive(props.metaIsPrivate),
        ]}
      >
        {props.meta}
      </Text>
    </VStack>
  );
}

// expo-widgets bundles this file on its own and reads the widget from the default export.
// eslint-disable-next-line import/no-default-export
export default createWidget('TractaToday', TractaToday);

import { Gauge, HStack, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  minimumScaleFactor,
  shapes,
  strokeBorder,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import type { WeekWidgetProps } from '@/shared/widgets';
import type { WidgetEnvironment } from 'expo-widgets';

/** Medium: the week strip with the goal progress. Lock Screen: the ring of workouts. */
function TractaWeek(props: WeekWidgetProps, env: WidgetEnvironment) {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = dark
    ? {
        bg: '#141412',
        card: '#1F1F1C',
        ink: '#F2EEE6',
        text2: '#CFCBBE',
        brand: '#F0A487',
        onBrand: '#1A1A17',
      }
    : {
        bg: '#F2EEE6',
        card: '#FFFFFF',
        ink: '#1A1A17',
        text2: '#6B6A63',
        brand: '#B4482A',
        onBrand: '#FFFFFF',
      };

  if (env.widgetFamily === 'accessoryCircular') {
    // The gauge's own labels don't render in a widget: the numbers sit on top of the ring.
    return (
      <ZStack modifiers={[widgetURL(props.url)]}>
        <Gauge
          value={props.signedIn && props.goal > 0 ? Math.min(1, props.done / props.goal) : 0}
          modifiers={[gaugeStyle('circularCapacity')]}
        />
        <VStack spacing={0}>
          <Text modifiers={[font({ family: 'Archivo75-ExtraBold', size: 18 })]}>
            {props.signedIn ? `${props.done}/${props.goal}` : '—'}
          </Text>
          <Text
            modifiers={[font({ family: 'Archivo100-SemiBold', size: 9 }), minimumScaleFactor(0.7)]}
          >
            {props.ringLabel}
          </Text>
        </VStack>
      </ZStack>
    );
  }

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
      spacing={10}
      modifiers={[containerBackground(c.bg, 'widget'), widgetURL(props.url)]}
    >
      <HStack>
        <Text modifiers={[font({ family: 'Archivo100-Bold', size: 13 }), foregroundStyle(c.ink)]}>
          {props.title}
        </Text>
        <Spacer />
        <Text
          modifiers={[font({ family: 'Archivo100-SemiBold', size: 11 }), foregroundStyle(c.text2)]}
        >
          {props.progress}
        </Text>
      </HStack>
      <HStack spacing={6}>
        {props.days.map((d, i) => (
          <VStack key={i} spacing={4}>
            <Text
              modifiers={[
                font({ family: 'Archivo100-SemiBold', size: 10 }),
                foregroundStyle(c.text2),
              ]}
            >
              {d.weekday}
            </Text>
            <Text
              modifiers={[
                font({ family: 'Archivo80-Bold', size: 15 }),
                // The run arrow is wider than a letter: it shrinks instead of truncating.
                lineLimit(1),
                minimumScaleFactor(0.5),
                foregroundStyle(d.done ? c.onBrand : c.ink),
                frame({ width: 34, height: 34 }),
                background(
                  d.done ? c.brand : c.card,
                  shapes.roundedRectangle({ cornerRadius: 10 }),
                ),
                strokeBorder({
                  content: d.today ? c.ink : 'transparent',
                  style: { lineWidth: 1.5 },
                  shape: 'roundedRectangle',
                  cornerRadius: 10,
                }),
              ]}
            >
              {d.plan}
            </Text>
          </VStack>
        ))}
      </HStack>
      {props.next ? (
        <Text
          modifiers={[
            font({ family: 'Archivo100-SemiBold', size: 11 }),
            foregroundStyle(c.text2),
            lineLimit(1),
          ]}
        >
          {props.next}
        </Text>
      ) : null}
    </VStack>
  );
}

// expo-widgets bundles this file on its own and reads the widget from the default export.
// eslint-disable-next-line import/no-default-export
export default createWidget('TractaWeek', TractaWeek);

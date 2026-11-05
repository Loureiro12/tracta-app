import { HStack, Link, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  privacySensitive,
  progressViewStyle,
  shapes,
  tint,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import type { SummaryWidgetProps } from '@/shared/widgets';
import type { WidgetEnvironment } from 'expo-widgets';

/** Large: sleep, steps and the race, with shortcuts to start a workout or a run. */
function TractaSummary(props: SummaryWidgetProps, env: WidgetEnvironment) {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = dark
    ? {
        bg: '#141412',
        card: '#1F1F1C',
        ink: '#F2EEE6',
        text2: '#CFCBBE',
        brand: '#F0A487',
        track: '#3E3D38',
        sleep: '#8A8DE8',
        steps: '#D8613C',
        onInk: '#1A1A17',
      }
    : {
        bg: '#F2EEE6',
        card: '#FFFFFF',
        ink: '#1A1A17',
        text2: '#6B6A63',
        brand: '#B4482A',
        track: '#E3DDD0',
        sleep: '#5B5FD6',
        steps: '#D8613C',
        onInk: '#FFFFFF',
      };
  const card = background(c.card, shapes.roundedRectangle({ cornerRadius: 16 }));

  if (!props.signedIn) {
    return (
      <VStack modifiers={[containerBackground(c.bg, 'widget'), widgetURL(props.url)]}>
        <Text modifiers={[font({ family: 'Archivo100-Bold', size: 17 }), foregroundStyle(c.ink)]}>
          {props.signedOutText}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={12}
      modifiers={[containerBackground(c.bg, 'widget'), widgetURL(props.url)]}
    >
      <HStack>
        <Text modifiers={[font({ family: 'Archivo100-Bold', size: 13 }), foregroundStyle(c.ink)]}>
          {props.title}
        </Text>
        <Spacer />
        <Text
          modifiers={[font({ family: 'Archivo100-Regular', size: 11 }), foregroundStyle(c.text2)]}
        >
          {props.updated}
        </Text>
      </HStack>

      <HStack spacing={10}>
        {[
          { m: props.sleep, color: c.sleep },
          { m: props.steps, color: c.steps },
        ].map(({ m, color }, i) => (
          <VStack
            key={i}
            alignment="leading"
            spacing={6}
            modifiers={[padding({ all: 12 }), frame({ minWidth: 0, maxWidth: 400 }), card]}
          >
            <HStack spacing={6}>
              <Text modifiers={[font({ size: 8 }), foregroundStyle(color)]}>●</Text>
              <Text
                modifiers={[
                  font({ family: 'Archivo100-SemiBold', size: 11 }),
                  foregroundStyle(c.ink),
                ]}
              >
                {m.label}
              </Text>
            </HStack>
            <Text
              modifiers={[
                font({ family: 'Archivo70-ExtraBold', size: 30 }),
                foregroundStyle(c.ink),
                privacySensitive(),
              ]}
            >
              {m.value}
            </Text>
            <ProgressView
              value={m.progress}
              modifiers={[progressViewStyle('linear'), tint(color), privacySensitive()]}
            />
          </VStack>
        ))}
      </HStack>

      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[padding({ all: 12 }), frame({ minWidth: 0, maxWidth: 800 }), card]}
      >
        {props.hasRace ? (
          <VStack alignment="leading" spacing={8}>
            <HStack>
              <Text
                modifiers={[
                  font({ family: 'Archivo100-Bold', size: 12 }),
                  foregroundStyle(c.ink),
                  lineLimit(1),
                ]}
              >
                {props.race.title}
              </Text>
              <Spacer />
              <Text
                modifiers={[
                  font({ family: 'Archivo100-Bold', size: 11 }),
                  foregroundStyle(c.brand),
                ]}
              >
                {props.race.countdown}
              </Text>
            </HStack>
            <HStack spacing={18}>
              {props.race.stats.map((s, i) => (
                <VStack key={i} alignment="leading" spacing={0}>
                  <Text
                    modifiers={[
                      font({ family: 'Archivo100-Regular', size: 10 }),
                      foregroundStyle(c.text2),
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text
                    modifiers={[
                      font({ family: 'Archivo80-Bold', size: 16 }),
                      foregroundStyle(c.ink),
                    ]}
                  >
                    {s.value}
                  </Text>
                </VStack>
              ))}
              <Spacer />
            </HStack>
          </VStack>
        ) : (
          <HStack>
            <Text
              modifiers={[
                font({ family: 'Archivo100-SemiBold', size: 12 }),
                foregroundStyle(c.text2),
              ]}
            >
              {props.noRace}
            </Text>
            <Spacer />
          </HStack>
        )}
      </VStack>

      <Spacer />
      <HStack spacing={10}>
        <Link destination={props.start.url}>
          <Text
            modifiers={[
              font({ family: 'Archivo100-Bold', size: 14 }),
              foregroundStyle(c.onInk),
              frame({ minWidth: 0, maxWidth: 400, minHeight: 40 }),
              background(c.ink, shapes.capsule()),
              lineLimit(1),
            ]}
          >
            {props.start.label}
          </Text>
        </Link>
        <Link destination={props.run.url}>
          <Text
            modifiers={[
              font({ family: 'Archivo100-Bold', size: 14 }),
              foregroundStyle(c.ink),
              frame({ width: 110, height: 40 }),
              background(c.card, shapes.capsule()),
            ]}
          >
            {props.run.label}
          </Text>
        </Link>
      </HStack>
    </VStack>
  );
}

// expo-widgets bundles this file on its own and reads the widget from the default export.
// eslint-disable-next-line import/no-default-export
export default createWidget('TractaSummary', TractaSummary);

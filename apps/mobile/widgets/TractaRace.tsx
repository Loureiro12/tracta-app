import { Text, VStack } from '@expo/ui/swift-ui';
import { font, lineLimit, minimumScaleFactor, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import type { RaceWidgetProps } from '@/shared/widgets';

/** Lock Screen: countdown and target pace of the race goal. */
function TractaRace(props: RaceWidgetProps) {
  'widget';
  if (!props.signedIn) {
    return (
      <VStack alignment="leading" modifiers={[widgetURL(props.url)]}>
        <Text modifiers={[font({ family: 'Archivo100-Bold', size: 13 })]}>
          {props.signedOutText}
        </Text>
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={1} modifiers={[widgetURL(props.url)]}>
      <Text modifiers={[font({ family: 'Archivo100-Bold', size: 11 }), lineLimit(1)]}>
        {props.title}
      </Text>
      <Text
        modifiers={[
          font({ family: 'Archivo75-ExtraBold', size: 19 }),
          lineLimit(1),
          minimumScaleFactor(0.7),
        ]}
      >
        {props.countdown}
      </Text>
      {props.pace ? (
        <Text modifiers={[font({ family: 'Archivo100-Regular', size: 11 }), lineLimit(1)]}>
          {props.pace}
        </Text>
      ) : null}
    </VStack>
  );
}

// expo-widgets bundles this file on its own and reads the widget from the default export.
// eslint-disable-next-line import/no-default-export
export default createWidget('TractaRace', TractaRace);

import { AccessoryWidgetBackground, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { font, minimumScaleFactor, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import type { StreakWidgetProps } from '@/shared/widgets';

/** Lock Screen: consecutive days with a workout. */
function TractaStreak(props: StreakWidgetProps) {
  'widget';
  return (
    <ZStack modifiers={[widgetURL(props.url)]}>
      <AccessoryWidgetBackground />
      <VStack spacing={0}>
        <Text modifiers={[font({ family: 'Archivo75-ExtraBold', size: 22 })]}>
          {props.signedIn ? String(props.days) : '—'}
        </Text>
        <Text
          modifiers={[font({ family: 'Archivo100-SemiBold', size: 9 }), minimumScaleFactor(0.7)]}
        >
          {props.signedIn ? props.label : 'Tracta'}
        </Text>
      </VStack>
    </ZStack>
  );
}

// expo-widgets bundles this file on its own and reads the widget from the default export.
// eslint-disable-next-line import/no-default-export
export default createWidget('TractaStreak', TractaStreak);

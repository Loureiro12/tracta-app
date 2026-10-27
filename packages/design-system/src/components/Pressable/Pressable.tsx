import { useCallback } from 'react';

import { Pressable as RNPressable } from 'react-native';

import type { Testable } from '../../testing/test-id';
import type {
  PressableProps as RNPressableProps,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from 'react-native';

export type PressableProps = Testable &
  Omit<RNPressableProps, 'testID' | 'style'> & {
    /** Static style or a function of the pressed state. */
    style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
    /** Opacity applied while pressed. */
    pressedOpacity?: number;
  };

/**
 * Low-level touchable. Prefer <Button> for actions; use Pressable for custom tappable areas.
 * `testID` is mandatory so every touch target is reachable from E2E.
 */
export function Pressable({ style, pressedOpacity = 0.7, ...rest }: PressableProps) {
  const resolveStyle = useCallback(
    (state: PressableStateCallbackType): StyleProp<ViewStyle> => {
      const base = typeof style === 'function' ? style(state) : style;
      return [base, state.pressed ? { opacity: pressedOpacity } : null];
    },
    [style, pressedOpacity],
  );
  return <RNPressable accessibilityRole="button" style={resolveStyle} {...rest} />;
}

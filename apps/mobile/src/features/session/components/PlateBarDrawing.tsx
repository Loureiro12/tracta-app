import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '@tracta/design-system';

import type { PlatesPlan } from '../model/session.logic';

const PLATE_W = 13;
const PLATE_GAP = 2;
const SLEEVE_W = 8;
const SLEEVE_H = 18;
const SHAFT_W = 96;
const SHAFT_H = 8;
const HEIGHT = 104;

type Props = { side: PlatesPlan['side'] };

/** Bar seen from the front: shaft, two sleeves and the plates loaded on each side (inner → outer). */
export function PlateBarDrawing({ side }: Props) {
  const theme = useTheme();
  const platesW = side.length * (PLATE_W + PLATE_GAP);
  const width = platesW * 2 + SLEEVE_W * 2 + SHAFT_W;
  const mid = HEIGHT / 2;
  const leftSleeveX = platesW;
  const shaftX = leftSleeveX + SLEEVE_W;
  const rightSleeveX = shaftX + SHAFT_W;
  const rightPlatesX = rightSleeveX + SLEEVE_W;

  return (
    <Svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`}>
      <Rect
        x={shaftX}
        y={mid - SHAFT_H / 2}
        width={SHAFT_W}
        height={SHAFT_H}
        fill={theme.colors.switchOff}
      />
      <Rect
        x={leftSleeveX}
        y={mid - SLEEVE_H / 2}
        width={SLEEVE_W}
        height={SLEEVE_H}
        rx={2}
        fill={theme.colors.text3}
      />
      <Rect
        x={rightSleeveX}
        y={mid - SLEEVE_H / 2}
        width={SLEEVE_W}
        height={SLEEVE_H}
        rx={2}
        fill={theme.colors.text3}
      />
      {side.map((plate, i) => {
        const offset = i * (PLATE_W + PLATE_GAP);
        const y = mid - plate.height / 2;
        const fill = theme.colors[plate.color];
        return [
          <Rect
            key={`l-${i}`}
            x={leftSleeveX - PLATE_W - offset}
            y={y}
            width={PLATE_W}
            height={plate.height}
            rx={3}
            fill={fill}
          />,
          <Rect
            key={`r-${i}`}
            x={rightPlatesX + offset}
            y={y}
            width={PLATE_W}
            height={plate.height}
            rx={3}
            fill={fill}
          />,
        ];
      })}
    </Svg>
  );
}

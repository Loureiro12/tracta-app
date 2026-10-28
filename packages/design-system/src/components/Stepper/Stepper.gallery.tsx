import { useState } from 'react';

import { Stepper } from './Stepper';
import { VStack } from '../Stack/Stack';

const ID = 'ds.stepper';

export function StepperGallery() {
  const [kg, setKg] = useState(60);
  return (
    <VStack testID={`${ID}.gallery`}>
      <Stepper
        testID={`${ID}.load`}
        valueLabel={`${kg} kg`}
        onDecrement={() => setKg((v) => v - 2.5)}
        onIncrement={() => setKg((v) => v + 2.5)}
        decrementLabel="Less"
        incrementLabel="More"
      />
    </VStack>
  );
}

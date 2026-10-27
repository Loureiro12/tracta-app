import { useState } from 'react';

import { TextField } from './TextField';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.text-field';

export function TextFieldGallery() {
  const [value, setValue] = useState('');
  return (
    <VStack testID={`${ID}.gallery`}>
      <TextField
        testID={`${ID}.default`}
        label="Name"
        placeholder="Type your name"
        value={value}
        onChangeText={setValue}
        helperText="Helper text"
      />
      <Text testID={`${ID}.echo`}>{`Value: ${value}`}</Text>
      <TextField
        testID={`${ID}.error`}
        label="Email"
        value="not-an-email"
        errorText="Invalid email"
      />
      <TextField testID={`${ID}.disabled`} label="Disabled" value="read only" editable={false} />
    </VStack>
  );
}

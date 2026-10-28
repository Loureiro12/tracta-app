import { useState } from 'react';

import { ListGroup, ListRow } from './ListRow';
import { Avatar } from '../Avatar/Avatar';
import { VStack } from '../Stack/Stack';
import { Switch } from '../Switch/Switch';
import { Text } from '../Text/Text';

const ID = 'ds.list-row';

export function ListRowGallery() {
  const [taps, setTaps] = useState(0);
  const [on, setOn] = useState(true);
  return (
    <VStack testID={`${ID}.gallery`}>
      <Text testID={`${ID}.taps`}>{`Row taps: ${taps}`}</Text>
      <ListGroup testID={`${ID}.group`}>
        <ListRow testID={`${ID}.value`} label="Unidades" value="kg" />
        <ListRow
          testID={`${ID}.chevron`}
          label="Notificações"
          value="2 ativas"
          chevron
          onPress={() => setTaps((n) => n + 1)}
        />
        <ListRow
          testID={`${ID}.description`}
          label="Quem vê meus treinos"
          description="Cargas e recordes ficam ocultos"
          value="Amigos"
          chevron
          onPress={() => setTaps((n) => n + 1)}
        />
        <ListRow
          testID={`${ID}.switch`}
          label="Descanso automático"
          trailing={<Switch testID={`${ID}.switch.control`} value={on} onValueChange={setOn} />}
        />
        <ListRow
          testID={`${ID}.leading`}
          label="Ana"
          leading={<Avatar initial="A" size={28} />}
          value="128 pts"
        />
        <ListRow
          testID={`${ID}.danger`}
          label="Excluir conta"
          labelColor="danger"
          chevron
          onPress={() => setTaps((n) => n + 1)}
        />
      </ListGroup>
    </VStack>
  );
}

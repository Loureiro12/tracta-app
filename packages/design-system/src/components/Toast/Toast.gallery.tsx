import { Toast } from './Toast';
import { VStack } from '../Stack/Stack';

const ID = 'ds.toast';

export function ToastGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <Toast testID={`${ID}.saved`} message="Treino salvo" />
    </VStack>
  );
}

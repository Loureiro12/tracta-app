import { Box } from '../Box/Box';
import { Text } from '../Text/Text';

const ID = 'ds.screen';

/** The gallery route itself is rendered inside <Screen>, so we only assert on markers here. */
export function ScreenGallery() {
  return (
    <Box testID={`${ID}.gallery`} gap="md">
      <Text testID={`${ID}.marker`}>Rendered inside a Screen with safe area and scroll.</Text>
      {Array.from({ length: 30 }, (_, i) => (
        <Text key={i} testID={`${ID}.row.${i}`} color="textSecondary">{`Row ${i}`}</Text>
      ))}
      <Text testID={`${ID}.bottom`}>Bottom reached</Text>
    </Box>
  );
}

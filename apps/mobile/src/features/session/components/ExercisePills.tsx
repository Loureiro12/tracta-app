import { StyleSheet } from 'react-native';

import { Box, HStack, Pressable } from '@tracta/design-system';

import { sessionIds } from '../session.testids';

import type { SessionExercise } from '../model/session.types';

type Props = {
  exercises: readonly SessionExercise[];
  current: number;
  onSelect: (index: number) => void;
};

/** One 5px pill per exercise: ink = current, brand = done, track = pending. */
export function ExercisePills({ exercises, current, onSelect }: Props) {
  return (
    <HStack testID={sessionIds.pill} gap="xs" px="screen" pt="sm">
      {exercises.map((exercise, index) => {
        const done = exercise.sets.length > 0 && exercise.sets.every((s) => s.done);
        return (
          <Pressable
            key={exercise.id}
            testID={`${sessionIds.pill}.${index}`}
            onPress={() => onSelect(index)}
            accessibilityLabel={exercise.name}
            style={styles.pill}
          >
            <Box bg={index === current ? 'ink' : done ? 'brand' : 'track'} style={styles.bar} />
          </Pressable>
        );
      })}
    </HStack>
  );
}

const styles = StyleSheet.create({
  pill: { flex: 1, height: 22, justifyContent: 'center' },
  bar: { height: 5, borderRadius: 3 },
});

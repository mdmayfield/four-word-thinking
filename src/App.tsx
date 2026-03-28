import { Box, Stack, Text } from '@mantine/core';
import GameBoard from './components/GameBoard';
import { GameStateProvider, useGameState } from './hooks/GameStateContext';

const GameStateDebug: React.FC = () => {
  const { savedSetup, guessSubmission } = useGameState();

  return (
    <Stack gap="xs" align="center" style={{ marginTop: '1rem' }}>
      <Text size="sm" fw={700}>GameState debug</Text>
      <Text size="xs">Saved setup: {savedSetup ? 'present' : 'not set'}</Text>
      <Text size="xs">Guess submission: {guessSubmission ? 'present' : 'none'}</Text>
    </Stack>
  );
};

function App() {
  const cards = [
    ['Console', 'Voice', 'Recipient', 'Cell'],
    ['Thunder', 'Straw', 'Religion', 'Promotion'],
    ['Padlock', 'Inside', 'Astronaut', 'Fish'],
    ['Finger', 'Note', 'Hard', 'Kitchen'],
  ] as const;

  return (
    <GameStateProvider>
      <Box ta="center" pt="lg" w="100%">
        <GameBoard cardWords={cards} />
        <GameStateDebug />
      </Box>
    </GameStateProvider>
  );
}

export default App;

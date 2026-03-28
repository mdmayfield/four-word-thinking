import { Box } from '@mantine/core';
import GameBoard from './components/GameBoard';
import { GameStateProvider } from './hooks/GameStateContext';

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
      </Box>
    </GameStateProvider>
  );
}

export default App;

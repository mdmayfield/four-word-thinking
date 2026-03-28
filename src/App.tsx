import { Box } from '@mantine/core';
import GameBoard from './components/GameBoard';

function App() {
  const cards = [
    ['Console', 'Voice', 'Recipient', 'Cell'],
    ['Thunder', 'Straw', 'Religion', 'Promotion'],
    ['Padlock', 'Inside', 'Astronaut', 'Fish'],
    ['Finger', 'Note', 'Hard', 'Kitchen'],
  ] as const;

  return (
    <Box ta="center" pt="lg" w="100%">
      <GameBoard cardWords={cards} />
    </Box>
  );
}

export default App;

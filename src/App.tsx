import { Box } from '@mantine/core';
import GameBoard from './components/GameBoard';
import { GameStateProvider } from './hooks/GameStateContext';
import { parseWordBank } from './utils/generateCards';
import wordBankRaw from './data/wordBank.txt?raw';

const wordBank = parseWordBank(wordBankRaw);

function App() {
  return (
    <GameStateProvider>
      <Box ta="center" pt="lg" w="100%">
        <GameBoard wordBank={wordBank} />
      </Box>
    </GameStateProvider>
  );
}

export default App;

import { useEffect } from 'react';
import { Box } from '@mantine/core';
import GameBoard from './components/GameBoard';
import { GameStateProvider } from './hooks/GameStateContext';
import { parseWordBank } from './utils/generateCards';
import wordBankRaw from './data/wordBank.txt?raw';

const wordBank = parseWordBank(wordBankRaw);
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT?.trim();

function App() {
  useEffect(() => {
    if (!import.meta.env.PROD || !ADSENSE_CLIENT) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-adsense-client="${ADSENSE_CLIENT}"]`
    );
    if (existingScript) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.crossOrigin = 'anonymous';
    script.dataset.adsenseClient = ADSENSE_CLIENT;
    document.head.appendChild(script);
  }, []);

  return (
    <GameStateProvider>
      <Box ta="center" w="100%">
        <GameBoard wordBank={wordBank} />
      </Box>
    </GameStateProvider>
  );
}

export default App;

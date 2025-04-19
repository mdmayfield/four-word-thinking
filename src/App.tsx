import { Box, Stack, Title } from '@mantine/core';
import WordCard from './components/WordCard';

function App() {
  return (
    <Box ta="center" pt="lg" w="100%">
      <Stack align="center" gap="xl">
        <Title>Four-Word Thinking</Title>
        <WordCard words={["red", "blue", "green", "yellow"]} />
      </Stack>
    </Box>
  );
}

export default App;

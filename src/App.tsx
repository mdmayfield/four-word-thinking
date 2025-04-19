import { Box, SimpleGrid, Stack, Title } from '@mantine/core';
import WordCard from './components/WordCard';

function App() {
  return (
    <Box ta="center" pt="lg" w="100%">
      <Stack align="center" gap="xl">
        <Title>Four-Word Thinking</Title>
        <SimpleGrid cols={2} spacing="none">
          <WordCard words={["red", "blue", "green", "yellow"]} />
          <WordCard words={["cat", "dog", "bird", "fish"]} />
          <WordCard words={["run", "jump", "skip", "hop"]} />
          <WordCard words={["hot", "cold", "warm", "cool"]} />
        </SimpleGrid>
      </Stack>
    </Box>
  );
}

export default App;

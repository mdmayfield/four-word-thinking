import { Box, SimpleGrid, Stack, Title } from '@mantine/core';
import WordCard from './components/WordCard';

function App() {
  return (
    <Box ta="center" pt="lg" w="100%">
      <Stack align="center" gap="xl">
        <Title>Four-Word Thinking</Title>
        <SimpleGrid cols={2} spacing="none">
          <WordCard words={["Console", "Voice", "Recipient", "Cell"]} />
          <WordCard words={["Thunder", "Straw", "Religion", "Promotion"]} />
          <WordCard words={["Padlock", "Inside", "Astronaut", "Fish"]} />
          <WordCard words={["Finger", "Note", "Hard", "Kitchen"]} />
        </SimpleGrid>
      </Stack>
    </Box>
  );
}

export default App;

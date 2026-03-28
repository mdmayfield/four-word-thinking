import React from 'react';
import { Paper, Text, Group, SimpleGrid } from '@mantine/core';
import { GuessResult } from '../../hooks/GameStateTypes';

const SLOT_LABELS = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];

interface SlotBadgeProps {
  label: string;
  cardCorrect: boolean;
  orientationCorrect: boolean;
}

const SlotBadge: React.FC<SlotBadgeProps> = ({ label, cardCorrect, orientationCorrect }) => {
  const allCorrect = cardCorrect && orientationCorrect;
  const color = allCorrect ? 'green' : cardCorrect ? 'orange' : 'red';
  const statusText = allCorrect
    ? '✓ Correct'
    : cardCorrect
    ? '~ Wrong rotation'
    : '✗ Wrong card';

  return (
    <Paper
      p="xs"
      withBorder
      style={{ borderColor: `var(--mantine-color-${color}-6)`, textAlign: 'center' }}
    >
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={600} c={color}>{statusText}</Text>
    </Paper>
  );
};

interface GuessResultDisplayProps {
  result: GuessResult;
  show?: boolean;
}

const GuessResultDisplay: React.FC<GuessResultDisplayProps> = ({ result, show = false }) => {
  if (!show) return null;
  const correctCount = result.slotResults.filter((r) => r.cardCorrect && r.orientationCorrect).length;

  return (
    <Paper p="md" withBorder shadow="xs" style={{ width: '100%', maxWidth: 420 }}>
      <Group justify="center" mb="sm">
        <Text fw={700} size="lg" c={result.isCorrect ? 'green' : 'red'}>
          {result.isCorrect
            ? '🎉 Perfect match!'
            : `${correctCount} / 4 slots correct`}
        </Text>
      </Group>
      <SimpleGrid cols={2} spacing="xs">
        {result.slotResults.map((slotResult, i) => (
          <SlotBadge
            key={i}
            label={SLOT_LABELS[i]}
            cardCorrect={slotResult.cardCorrect}
            orientationCorrect={slotResult.orientationCorrect}
          />
        ))}
      </SimpleGrid>
    </Paper>
  );
};

export default GuessResultDisplay;

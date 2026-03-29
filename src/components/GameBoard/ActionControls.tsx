import React from 'react';
import { Button, Stack } from '@mantine/core';
import { Mode } from '../Board/types';

interface ActionControlsProps {
  mode: Mode;
  onWritingSubmit: () => void;
  writingSubmitEnabled: boolean;
  onGuessingSubmit: () => void;
  guessingSubmitEnabled: boolean;
  isWon: boolean;
  onNextRound: () => void;
  onGiveUp: () => void;
  giveUpEnabled: boolean;
}

const ActionControls: React.FC<ActionControlsProps> = ({
  mode,
  onWritingSubmit,
  writingSubmitEnabled,
  onGuessingSubmit,
  guessingSubmitEnabled,
  isWon,
  onNextRound,
  onGiveUp,
  giveUpEnabled,
}) => (
  <Stack gap="xs" align="center" style={{ width: '100%' }}>
    {mode === 'writing' ? (
      <Button onClick={onWritingSubmit} size="sm" mt="xs" disabled={!writingSubmitEnabled}>
        Save Clues
      </Button>
    ) : isWon ? (
      <Button onClick={onNextRound} size="sm" mt="xs" color="green">
        Next Round
      </Button>
    ) : (
      <>
        <Button onClick={onGuessingSubmit} size="sm" mt="xs" disabled={!guessingSubmitEnabled}>
          Submit Guess
        </Button>
        <Button onClick={onGiveUp} size="sm" color="red" disabled={!giveUpEnabled}>
          Give Up
        </Button>
      </>
    )}
  </Stack>
);

export default ActionControls;

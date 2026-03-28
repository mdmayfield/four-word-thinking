import React from 'react';
import { Button, Stack } from '@mantine/core';
import { Mode } from '../Board/types';

interface ActionControlsProps {
  mode: Mode;
  onWritingSubmit: () => void;
  onGuessingSubmit: () => void;
  guessingSubmitEnabled: boolean;
}

const ActionControls: React.FC<ActionControlsProps> = ({
  mode,
  onWritingSubmit,
  onGuessingSubmit,
  guessingSubmitEnabled,
}) => (
  <Stack gap="xs" align="center" style={{ width: '100%' }}>
    {mode === 'writing' ? (
      <Button onClick={onWritingSubmit} size="sm" mt="xs">
        Save Setup
      </Button>
    ) : (
      <Button onClick={onGuessingSubmit} size="sm" mt="xs" disabled={!guessingSubmitEnabled}>
        Submit Guess
      </Button>
    )}
  </Stack>
);

export default ActionControls;

import React from 'react';
import { Button, Center } from '@mantine/core';
import { Mode } from '../gameBoardUtils';

interface ModeToggleProps {
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, setMode }) => (
  <Center>
    <Button
      color={mode === 'writing' ? 'blue' : 'gray'}
      onClick={() => setMode('writing')}
      mr="xs"
    >
      Writing Mode
    </Button>
    <Button color={mode === 'guessing' ? 'blue' : 'gray'} onClick={() => setMode('guessing')}>
      Guessing Mode
    </Button>
  </Center>
);

export default ModeToggle;

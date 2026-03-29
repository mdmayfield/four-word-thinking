import React from 'react';
import { Button, Center, Text } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';

interface RotationControlsProps {
  boardRotation: number;
  rotateBoard: (direction: 'left' | 'right') => void;
  showLabel?: boolean;
  boardScale?: number;
}

const RotationControls: React.FC<RotationControlsProps> = ({
  boardRotation,
  rotateBoard,
  showLabel = false,
  boardScale = 1,
}) => (
  <Center style={{ width: `${640 * boardScale}px`, justifyContent: 'space-between', maxWidth: '100%' }}>
    <Button size="xs" onClick={() => rotateBoard('left')} aria-label="Rotate board left">
      <IconArrowBackUp size={16} />
    </Button>
    {showLabel && <Text mx="xs">Board Rotation: {boardRotation}°</Text>}
    <Button size="xs" onClick={() => rotateBoard('right')} aria-label="Rotate board right">
      <IconArrowForwardUp size={16} />
    </Button>
  </Center>
);

export default RotationControls;

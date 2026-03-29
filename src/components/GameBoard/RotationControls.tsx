import React from 'react';
import { Button, Center, Text } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';

interface RotationControlsProps {
  boardRotation: number;
  rotateBoard: (direction: 'left' | 'right') => void;
  showLabel?: boolean;
}

const RotationControls: React.FC<RotationControlsProps> = ({ boardRotation, rotateBoard, showLabel = false }) => (
  <Center style={{ width: '640px', justifyContent: 'space-between' }}>
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

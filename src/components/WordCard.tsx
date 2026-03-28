import React from 'react';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { useCardRotation } from './WordCard/useCardRotation';

interface WordCardProps {
  id?: string;
  words: readonly [string, string, string, string];
  boardRotation: number;
  topWordIndex: number;
  isRotationEnabled: boolean;
  onRotate?: (direction: 'left' | 'right') => void;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
}

const ROTATION_DURATION = 300; // ms
const EDGE_SPACING = '0px';

const WordCard: React.FC<WordCardProps> = ({
  id,
  words,
  boardRotation,
  topWordIndex,
  isRotationEnabled,
  onRotate,
  draggable,
  onDragStart,
}) => {
  const rightWordIndex = (topWordIndex + 1) % 4;
  const bottomWordIndex = (topWordIndex + 2) % 4;
  const leftWordIndex = (topWordIndex + 3) % 4;

  const { rotation, isHovered, setIsHovered, isRotating, handleRotate } = useCardRotation({
    isRotationEnabled,
    onRotate,
    duration: ROTATION_DURATION,
  });

  const wordStyle: React.CSSProperties = {
    fontSize: '32px',
    position: 'absolute',
  };

  const controlWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    transform: `rotate(${-boardRotation}deg)`,
    transformOrigin: 'center center',
  };

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    padding: '5px',
    zIndex: 2,
    opacity: isRotating ? 0 : isHovered ? 1 : 0.1,
    transition: 'opacity 0.2s',
    pointerEvents: 'auto',
  };

  const topLeftButtonStyle = { ...buttonStyle, top: '10px', left: '10px' };
  const topRightButtonStyle = { ...buttonStyle, top: '10px', right: '10px' };

  return (
    <div
      id={id}
      draggable={draggable}
      onDragStart={onDragStart}
      style={{
        width: '320px',
        height: '320px',
        border: '2px solid black',
        backgroundColor: 'white',
        position: 'relative',
        transition: `transform ${isRotating ? ROTATION_DURATION : 0}ms linear`,
        transform: `rotate(${rotation}deg)`,
        zIndex: isRotating ? 10 : 1,
        cursor: draggable ? 'grab' : 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRotationEnabled && (
        <div style={controlWrapperStyle}>
          <Button
            style={topLeftButtonStyle}
            aria-label="Rotate left"
            onClick={() => handleRotate('left')}
          >
            <IconArrowBackUp size={24} style={{ display: 'block' }} />
          </Button>

          <Button
            style={topRightButtonStyle}
            aria-label="Rotate right"
            onClick={() => handleRotate('right')}
          >
            <IconArrowForwardUp size={24} style={{ display: 'block' }} />
          </Button>
        </div>
      )}

      <div style={{
        ...wordStyle,
        left: '50%',
        top: EDGE_SPACING,
        transform: 'translateX(-50%)',
      }}>
        {words[topWordIndex]}
      </div>

      <div style={{
        ...wordStyle,
        right: EDGE_SPACING,
        top: '50%',
        transform: 'translateY(-50%)',
        writingMode: 'vertical-lr'
      }}>
        {words[rightWordIndex]}
      </div>

      <div style={{
        ...wordStyle,
        left: '50%',
        bottom: EDGE_SPACING,
        transform: 'translateX(-50%) rotate(180deg)',
      }}>
        {words[bottomWordIndex]}
      </div>

      <div style={{
        ...wordStyle,
        left: EDGE_SPACING,
        top: '50%',
        transform: 'translateY(-50%) rotate(180deg)',
        writingMode: 'vertical-lr'
      }}>
        {words[leftWordIndex]}
      </div>
    </div>
  );
};

export default WordCard;
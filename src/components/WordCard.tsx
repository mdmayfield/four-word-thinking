import React from 'react';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { useCardRotation } from './WordCard/useCardRotation';
import styles from './WordCard/WordCard.module.css';

interface WordCardProps {
  id?: string;
  words: readonly [string, string, string, string];
  boardRotation: number;
  topWordIndex: number;
  isRotationEnabled: boolean;
  onRotate?: (direction: 'left' | 'right') => void;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  isCorrect?: boolean;
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
  isCorrect,
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

  return (
    <div
      id={id}
      draggable={draggable}
      onDragStart={onDragStart}
      className={`${styles.container} ${draggable ? styles.containerDrag : ''}`}
      style={{
        transition: `transform ${isRotating ? ROTATION_DURATION : 0}ms linear`,
        transform: `rotate(${rotation}deg)`,
        zIndex: isRotating ? 10 : 1,
        backgroundColor: isCorrect ? '#ffd700' : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRotationEnabled && (
        <div className={styles.controls} style={{ transform: `rotate(${-boardRotation}deg)` }}>
          <Button
            className={`${styles.buttonBase} ${isHovered ? styles.buttonVisible : ''}`}
            aria-label="Rotate left"
            onClick={() => handleRotate('left')}
            style={{ top: '10px', left: '10px' }}
          >
            <IconArrowBackUp size={24} style={{ display: 'block' }} />
          </Button>

          <Button
            className={`${styles.buttonBase} ${isHovered ? styles.buttonVisible : ''}`}
            aria-label="Rotate right"
            onClick={() => handleRotate('right')}
            style={{ top: '10px', right: '10px' }}
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
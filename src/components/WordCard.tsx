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
  onTouchStart?: React.TouchEventHandler<HTMLDivElement>;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  isCorrect?: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
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
  onTouchStart,
  onClick,
  isCorrect,
  isDragging,
  isSelected,
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
      onTouchStart={onTouchStart}
      onClick={onClick}
      className={`${styles.container} ${draggable ? styles.containerDrag : ''} ${isSelected ? styles.containerSelected : ''}`}
      style={{
        transition: `transform ${isRotating ? ROTATION_DURATION : 0}ms linear`,
        transform: `rotate(${rotation}deg)`,
        zIndex: isRotating ? 10 : 1,
        backgroundColor: isCorrect ? '#80ff00' : undefined,
        opacity: isDragging ? 0.35 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRotationEnabled && (
        <div className={styles.controls} style={{ transform: `rotate(${-boardRotation}deg)` }}>
          <button
            type="button"
            className={`${styles.mobileTapZone} ${styles.mobileTapZoneLeft}`}
            aria-label="Rotate left"
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleRotate('left');
            }}
          />

          <button
            type="button"
            className={`${styles.mobileTapZone} ${styles.mobileTapZoneRight}`}
            aria-label="Rotate right"
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleRotate('right');
            }}
          />

          <Button
            className={`${styles.buttonBase} ${styles.buttonLeft} ${isHovered ? styles.buttonVisible : ''}`}
            aria-label="Rotate left"
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleRotate('left');
            }}
          >
            <IconArrowBackUp size={24} style={{ display: 'block' }} />
          </Button>

          <Button
            className={`${styles.buttonBase} ${styles.buttonRight} ${isHovered ? styles.buttonVisible : ''}`}
            aria-label="Rotate right"
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleRotate('right');
            }}
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
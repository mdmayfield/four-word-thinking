import React, { useState } from 'react';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { Button } from '@mantine/core';

interface WordCardProps {
  words: readonly [string, string, string, string];
}

const ROTATION_DURATION = 300; // ms
const EDGE_SPACING = '0px';

const WordCard: React.FC<WordCardProps> = ({ words }) => {
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [topWordIndex, setTopWordIndex] = useState(0);
  const rightWordIndex = (topWordIndex + 1) % 4;
  const bottomWordIndex = (topWordIndex + 2) % 4;
  const leftWordIndex = (topWordIndex + 3) % 4;

  const handleRotate = (direction: 'left' | 'right') => {
    setIsRotating(true);
    const degrees = direction === 'right' ? 90 : -90;
    const newTopWord = direction === 'right' ? leftWordIndex : rightWordIndex;
    setRotation(degrees);
    setTimeout(() => {
      setIsRotating(false);
      setRotation(0);
      setTopWordIndex(newTopWord);
    }, ROTATION_DURATION);
  };

  const wordStyle: React.CSSProperties = {
    fontSize: '32px',
    position: 'absolute',
  }

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    padding: '5px',
    zIndex: 1,
    opacity: isRotating ? 0 : isHovered ? 1 : 0.1,
    transition: 'opacity 0.2s'
  }

  return (
    <div style={{
      width: '320px',
      height: '320px',
      border: '2px solid black',
      backgroundColor: 'white',
      position: 'relative',
      transition: `transform ${isRotating ? ROTATION_DURATION : 0}ms linear`,
      transform: `rotate(${rotation}deg)`,
      zIndex: isRotating ? 10 : 1
    }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <Button
        style={{ ...buttonStyle, left: '10px' }}
        aria-label="Rotate left"
        onClick={() => handleRotate('left')}
      >
        <IconArrowBackUp size={24} />
      </Button>

      <Button
        style={{ ...buttonStyle, right: '10px' }}
        aria-label="Rotate right"
        onClick={() => handleRotate('right')}
      >
        <IconArrowForwardUp size={24} />
      </Button>

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
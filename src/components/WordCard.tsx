import React from 'react';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { Button } from '@mantine/core';

interface WordCardProps {
  words: [string, string, string, string];
}

const WordCard: React.FC<WordCardProps> = ({ words }) => {
  const EDGE_SPACING = `0px`;
  const wordStyle: React.CSSProperties = {
    fontSize: `32px`,
    position: 'absolute'
  }

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    padding: '5px',
    zIndex: 1
  }

  return (
    <div style={{
      width: '320px',
      height: '320px',
      border: '2px solid black',
      backgroundColor: 'white',
      position: 'relative'
    }}>
      <Button
        style={{ ...buttonStyle, left: '10px' }}
        aria-label="Rotate left"
      >
        <IconArrowBackUp size={24} />
      </Button>

      <Button
        style={{ ...buttonStyle, right: '10px' }}
        aria-label="Rotate right"
      >
        <IconArrowForwardUp size={24} />
      </Button>

      {/* Top word */}
      <div style={{
        ...wordStyle,
        left: '50%',
        top: EDGE_SPACING,
        transform: 'translateX(-50%)',
      }}>
        {words[0]}
      </div>

      {/* Right word */}
      <div style={{
        ...wordStyle,
        right: EDGE_SPACING,
        top: '50%',
        transform: 'translateY(-50%) rotate(90deg)',
      }}>
        {words[1]}
      </div>

      {/* Bottom word */}
      <div style={{
        ...wordStyle,
        left: '50%',
        bottom: EDGE_SPACING,
        transform: 'translateX(-50%) rotate(180deg)',
      }}>
        {words[2]}
      </div>

      {/* Left word */}
      <div style={{
        ...wordStyle,
        left: EDGE_SPACING,
        top: '50%',
        transform: 'translateY(-50%) rotate(-90deg)',
      }}>
        {words[3]}
      </div>
    </div>
  );
};

export default WordCard;
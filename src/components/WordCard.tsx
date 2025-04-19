import React from 'react';

interface WordCardProps {
  words: [string, string, string, string];
}

const WordCard: React.FC<WordCardProps> = ({ words }) => {
  const EDGE_SPACING = `0px`;
  const wordStyle: React.CSSProperties = {
    fontSize: `32px`,
    position: 'absolute'
  }

  return (
    <div style={{
      width: '320px',
      height: '320px',
      border: '2px solid black',
      backgroundColor: 'white',
      position: 'relative'
    }}>
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
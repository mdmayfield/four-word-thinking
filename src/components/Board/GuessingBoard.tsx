import React from 'react';
import { Text } from '@mantine/core';
import WordCard from '../WordCard';
import { CardState } from '../../hooks/GameStateTypes';

interface GuessingBoardProps {
  slotCardIds: (string | null)[];
  primeLookup: Record<string, CardState>;
  decoyState: CardState;
  displayRotation: number;
  setCardTopWord: (cardId: string, direction: 'left' | 'right') => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  handleDropOnSlot: (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => void;
}

const GuessingBoard: React.FC<GuessingBoardProps> = ({
  slotCardIds,
  primeLookup,
  decoyState,
  displayRotation,
  setCardTopWord,
  handleDragStart,
  handleDropOnSlot,
}) => (
  <>
    {[0, 1, 2, 3].map((slot) => {
      const cardId = slotCardIds[slot];
      return (
        <div
          key={slot}
          onDrop={(e) => handleDropOnSlot(e, slot)}
          onDragOver={(e) => e.preventDefault()}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxSizing: 'border-box',
            outline: '2px dashed #bbb',
            outlineOffset: '-2px',
          }}
        >
          {cardId ? (
            <WordCard
              id={cardId}
              words={primeLookup[cardId]?.words ?? decoyState.words}
              boardRotation={displayRotation}
              topWordIndex={primeLookup[cardId]?.topWordIndex ?? decoyState.topWordIndex}
              isRotationEnabled
              onRotate={(direction) => setCardTopWord(cardId, direction)}
              draggable
              onDragStart={(e) => handleDragStart(e, cardId)}
            />
          ) : (
            <Text
              style={{
                transform: `rotate(${-displayRotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.3s ease',
              }}
            >
              Drop card here
            </Text>
          )}
        </div>
      );
    })}
  </>
);

export default GuessingBoard;

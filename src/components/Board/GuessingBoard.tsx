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
  onCardTouchStart?: (
    event: React.TouchEvent<HTMLDivElement>,
    cardId: string,
    source: 'board' | 'offboard'
  ) => void;
  isMobile?: boolean;
  activeTouchCardId?: string | null;
  slotClassName?: string;
  dropTextClassName?: string;
  correctSlots: number[];
}

const GuessingBoard: React.FC<GuessingBoardProps> = ({
  slotCardIds,
  primeLookup,
  decoyState,
  displayRotation,
  setCardTopWord,
  handleDragStart,
  handleDropOnSlot,
  onCardTouchStart,
  isMobile = false,
  activeTouchCardId,
  slotClassName,
  dropTextClassName,
  correctSlots,
}) => (
  <>
    {[0, 1, 2, 3].map((slot) => {
      const cardId = slotCardIds[slot];
      const isLocked = correctSlots.includes(slot);
      return (
        <div
          key={slot}
          onDrop={(e) => handleDropOnSlot(e, slot)}
          onDragEnter={(e) => e.preventDefault()}
          onDragOver={(e) => e.preventDefault()}
          className={slotClassName}
        >
          {cardId ? (
            <WordCard
              id={cardId}
              words={primeLookup[cardId]?.words ?? decoyState.words}
              boardRotation={displayRotation}
              topWordIndex={
                (primeLookup[cardId]?.topWordIndex ?? decoyState.topWordIndex)
              }
              isRotationEnabled={!isLocked}
              onRotate={isLocked ? undefined : (direction) => setCardTopWord(cardId, direction)}
              draggable={!isLocked && !isMobile}
              onDragStart={isLocked || isMobile ? undefined : (e) => handleDragStart(e, cardId)}
              onTouchStart={
                isLocked || !onCardTouchStart
                  ? undefined
                  : (event) => onCardTouchStart(event, cardId, 'board')
              }
              isCorrect={isLocked}
              isDragging={activeTouchCardId === cardId}
            />
          ) : (
            <Text
              className={dropTextClassName}
              style={{
                transform: `rotate(${-displayRotation}deg)`,
                transformOrigin: 'center',
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

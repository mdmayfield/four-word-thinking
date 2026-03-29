import React from 'react';
import { Text } from '@mantine/core';
import WordCard from '../WordCard';
import { CardState } from '../../hooks/GameStateTypes';
import gridStyles from './BoardGrid.module.css';

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
  selectedCardId?: string | null;
  handleCardClick?: (cardId: string, source: 'board' | 'offboard', pos: { x: number; y: number }) => void;
  handleSlotClick?: (slotIndex: number, pos: { x: number; y: number }) => void;
  draggingCardId?: string | null;
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
  selectedCardId,
  handleCardClick,
  handleSlotClick,
  draggingCardId,
}) => (
  <>
    {[0, 1, 2, 3].map((slot) => {
      const cardId = slotCardIds[slot];
      const isLocked = correctSlots.includes(slot);
      const activeCardId = selectedCardId ?? draggingCardId ?? null;
      const isEligibleTarget =
        activeCardId !== null &&
        !isLocked &&
        slotCardIds[slot] !== activeCardId;
      return (
        <div
          key={slot}
          onDrop={(e) => handleDropOnSlot(e, slot)}
          onDragEnter={(e) => e.preventDefault()}
          onDragOver={(e) => e.preventDefault()}
          onClick={(e) => {
            if (e.target instanceof Element && e.target.closest('button')) return;
            e.stopPropagation();
            if (cardId) {
              handleCardClick?.(cardId, 'board', { x: e.clientX, y: e.clientY });
            } else {
              handleSlotClick?.(slot, { x: e.clientX, y: e.clientY });
            }
          }}
          className={`${slotClassName ?? ''} ${!cardId && isEligibleTarget ? gridStyles.slotEligible : ''}`}
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
              isSelected={selectedCardId === cardId}
              isEligibleTarget={isEligibleTarget}
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

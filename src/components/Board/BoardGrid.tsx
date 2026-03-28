import React from 'react';
import { Text } from '@mantine/core';
import WordCard from '../WordCard';
import EdgeInputs from '../EdgeInputs';
import { CardState } from '../../hooks/GameStateTypes';
import { Mode, getSlotFromPoint } from '../gameBoardUtils';

interface BoardGridProps {
  mode: Mode;
  cards: CardState[];
  slotCardIds: (string | null)[];
  primeLookup: Record<string, CardState>;
  decoyState: CardState;
  edges: readonly [string, string, string, string];
  setEdges: React.Dispatch<React.SetStateAction<readonly [string, string, string, string]>>;
  displayRotation: number;
  boardRotation: number;
  disableTransition: boolean;
  setDisableTransition: React.Dispatch<React.SetStateAction<boolean>>;
  boardRect: DOMRect | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
  handleDropOnSlot: (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => void;
  setCardTopWord: (cardId: string, direction: 'left' | 'right') => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
}

const BoardGrid: React.FC<BoardGridProps> = ({
  mode,
  cards,
  slotCardIds,
  primeLookup,
  decoyState,
  displayRotation,
  boardRotation,
  disableTransition,
  setDisableTransition,
  boardRect,
  gridRef,
  handleDropOnSlot,
  setCardTopWord,
  handleDragStart,
  edges,
  setEdges,
}) => {

  return (
    <div
      ref={gridRef}
      style={{
        position: 'absolute',
        width: '640px',
        height: '640px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '0px',
        transition: disableTransition ? 'none' : 'transform 0.3s ease',
        transform: `rotate(${displayRotation}deg)`,
      }}
      onTransitionEnd={() => {
        if (displayRotation % 360 !== boardRotation) {
          setDisableTransition(true);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const targetSlot = getSlotFromPoint(e.clientX, e.clientY, boardRect, displayRotation);
        if (targetSlot !== null) {
          handleDropOnSlot(e as React.DragEvent<HTMLDivElement>, targetSlot);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {mode === 'writing'
        ? cards.map((card) => (
            <WordCard
              key={card.id}
              id={card.id}
              words={card.words}
              boardRotation={displayRotation}
              topWordIndex={card.topWordIndex}
              isRotationEnabled={false}
              onRotate={() => {}}
            />
          ))
        : [0, 1, 2, 3].map((slot) => {
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
      <EdgeInputs edges={edges} setEdges={setEdges} mode={mode} />
    </div>
  );
};

export default BoardGrid;

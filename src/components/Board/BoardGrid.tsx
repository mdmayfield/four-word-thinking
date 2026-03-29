import React from 'react';
import EdgeInputs from '../EdgeInputs';
import { CardState } from '../../hooks/GameStateTypes';
import { getSlotFromPoint } from '../gameBoardUtils';
import { Mode, EdgeTuple } from './types';
import WritingBoard from './WritingBoard';
import GuessingBoard from './GuessingBoard';
import styles from './BoardGrid.module.css';

interface BoardGridProps {
  mode: Mode;
  cards: CardState[];
  slotCardIds: (string | null)[];
  primeLookup: Record<string, CardState>;
  decoyState: CardState;
  edges: EdgeTuple;
  setEdges: React.Dispatch<React.SetStateAction<EdgeTuple>>;
  onEdgeFocus?: (edgeIndex: number) => void;
  displayRotation: number;
  boardRotation: number;
  disableTransition: boolean;
  setDisableTransition: React.Dispatch<React.SetStateAction<boolean>>;
  boardRect: DOMRect | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
  handleDropOnSlot: (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => void;
  setCardTopWord: (cardId: string, direction: 'left' | 'right') => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  correctSlots: number[];
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
  onEdgeFocus,
  correctSlots,
}) => (
  <div
    ref={gridRef}
    className={styles.gridWrapper}
    style={{
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
    {mode === 'writing' ? (
      <WritingBoard cards={cards} displayRotation={displayRotation} />
    ) : (
      <GuessingBoard
        slotCardIds={slotCardIds}
        primeLookup={primeLookup}
        decoyState={decoyState}
        displayRotation={displayRotation}
        setCardTopWord={setCardTopWord}
        handleDragStart={handleDragStart}
        handleDropOnSlot={handleDropOnSlot}
        slotClassName={styles.slot}
        dropTextClassName={styles.dropText}
        correctSlots={correctSlots}
      />
    )}

    <EdgeInputs edges={edges} setEdges={setEdges} mode={mode} onEdgeFocus={onEdgeFocus} />
  </div>
);

export default BoardGrid;

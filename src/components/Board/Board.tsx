import React from 'react';
import BoardGrid from './BoardGrid';
import { Mode, EdgeTuple } from './types';
import { CardState } from '../../hooks/GameStateTypes';
import styles from './Board.module.css';

interface BoardProps {
  mode: Mode;
  boardRef: React.RefObject<HTMLDivElement | null>;
  gridRef: React.RefObject<HTMLDivElement | null>;
  boardRect: DOMRect | null;
  displayRotation: number;
  boardRotation: number;
  disableTransition: boolean;
  setDisableTransition: React.Dispatch<React.SetStateAction<boolean>>;
  edges: EdgeTuple;
  setEdges: React.Dispatch<React.SetStateAction<EdgeTuple>>;
  onEdgeFocus?: (edgeIndex: number) => void;
  focusEdgeIndex?: number | null;
  focusRequestId?: number;
  cards: CardState[];
  slotCardIds: (string | null)[];
  primeLookup: Record<string, CardState>;
  decoyState: CardState;
  setCardTopWord: (cardId: string, direction: 'left' | 'right') => void;
  handleDropOnSlot: (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  onCardTouchStart?: (
    event: React.TouchEvent<HTMLDivElement>,
    cardId: string,
    source: 'board' | 'offboard'
  ) => void;
  isMobile?: boolean;
  activeTouchCardId?: string | null;
  correctSlots: number[];
  selectedCardId?: string | null;
  handleCardClick?: (cardId: string, source: 'board' | 'offboard', pos: { x: number; y: number }) => void;
  handleSlotClick?: (slotIndex: number, pos: { x: number; y: number }) => void;
  draggingCardId?: string | null;
}

const Board: React.FC<BoardProps> = ({
  mode,
  boardRef,
  gridRef,
  boardRect,
  displayRotation,
  boardRotation,
  disableTransition,
  setDisableTransition,
  edges,
  setEdges,
  onEdgeFocus,
  focusEdgeIndex,
  focusRequestId,
  cards,
  slotCardIds,
  primeLookup,
  decoyState,
  setCardTopWord,
  handleDropOnSlot,
  handleDragStart,
  onCardTouchStart,
  isMobile,
  activeTouchCardId,
  correctSlots,
  selectedCardId,
  handleCardClick,
  handleSlotClick,
  draggingCardId,
}) => (
  <div ref={boardRef} className={styles.wrapper}>
    <BoardGrid
      mode={mode}
      cards={cards}
      slotCardIds={slotCardIds}
      primeLookup={primeLookup}
      decoyState={decoyState}
      edges={edges}
      setEdges={setEdges}
      onEdgeFocus={onEdgeFocus}
      focusEdgeIndex={focusEdgeIndex}
      focusRequestId={focusRequestId}
      displayRotation={displayRotation}
      boardRotation={boardRotation}
      disableTransition={disableTransition}
      setDisableTransition={setDisableTransition}
      boardRect={boardRect}
      gridRef={gridRef}
      handleDropOnSlot={handleDropOnSlot}
      setCardTopWord={setCardTopWord}
      handleDragStart={handleDragStart}
      onCardTouchStart={onCardTouchStart}
      isMobile={isMobile}
      activeTouchCardId={activeTouchCardId}
      correctSlots={correctSlots}
      selectedCardId={selectedCardId}
      handleCardClick={handleCardClick}
      handleSlotClick={handleSlotClick}
      draggingCardId={draggingCardId}
    />
  </div>
);

export default Board;

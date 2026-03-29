import React, { useEffect, useRef, useState } from 'react';
import { Stack } from '@mantine/core';
import confetti from 'canvas-confetti';
import Board from './Board/Board';
import { useGameBoard } from './Board/useGameBoard';
import ModeToggle from './GameBoard/ModeToggle';
import RotationControls from './GameBoard/RotationControls';
import ActionControls from './GameBoard/ActionControls';
import DebugCardList from './GameBoard/DebugCardList';
import GuessResultDisplay from './GameBoard/GuessResultDisplay';
import OffboardCards from './OffboardCards';
import WordCard from './WordCard';
import AdBanner from './common/AdBanner';
import { useGameState } from '../hooks/GameStateContext';
import { checkGuess } from '../utils/checkGuess';
import { useBoardScale } from '../hooks/useBoardScale';
import { getSlotFromPoint } from './gameBoardUtils';
import styles from './GameBoard.module.css';

const DEBUG = false; // import.meta.env.DEV;
const TOUCH_HOLD_DELAY = 300;
const TOUCH_CANCEL_DISTANCE = 12;
const BASE_CARD_SIZE = 320;

interface GameBoardProps {
  wordBank: string[];
  initialEdges?: readonly [string, string, string, string];
}

type TouchDragSource = 'board' | 'offboard';

interface ActiveTouchDrag {
  cardId: string;
  source: TouchDragSource;
  touchId: number;
  clientX: number;
  clientY: number;
}

interface PendingTouchDrag extends ActiveTouchDrag {
  startX: number;
  startY: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  wordBank,
  initialEdges = ['', '', '', ''] as const,
}) => {
  const { savedSetup, guessSubmission } = useGameState();
  const guessResult =
    savedSetup && guessSubmission ? checkGuess(savedSetup, guessSubmission) : null;
  const { boardScale, isMobile } = useBoardScale();

  const {
    mode,
    setMode,
    boardRef,
    gridRef,
    boardRect,
    displayRotation,
    boardRotation,
    disableTransition,
    setDisableTransition,
    edges,
    setEdges,
    cards,
    slotCardIds,
    offboardCardIds,
    offboardCardPositions,
    topOffboardCardId,
    decoyState,
    guessingSubmitEnabled,
    primeLookup,
    rotateBoard,
    rotateBoardTo,
    setCardTopWord,
    moveCardToSlot,
    moveCardOffBoard,
    correctSlots,
    handleDropOnSlot,
    handleDragStart,
    writingSubmit,
    guessingSubmit,
    nextRound,
    selectedCardId,
    deselectCard,
    handleCardClick,
    handleSlotClick,
  } = useGameBoard(wordBank, initialEdges, isMobile);

  const EDGE_TARGET_ROTATIONS = [0, 270, 180, 90] as const;
  const [focusEdgeIndex, setFocusEdgeIndex] = useState<number | null>(null);
  const [focusRequestId, setFocusRequestId] = useState(0);
  const touchHoldTimeoutRef = useRef<number | null>(null);
  const pendingTouchDragRef = useRef<PendingTouchDrag | null>(null);
  const [activeTouchDrag, setActiveTouchDrag] = useState<ActiveTouchDrag | null>(null);

  // Escape key to deselect
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') deselectCard();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deselectCard]);

  const requestEdgeFocus = (edgeIndex: number) => {
    setFocusEdgeIndex(edgeIndex);
    setFocusRequestId((prev) => prev + 1);
  };

  const handleEdgeFocus = (edgeIndex: number) => {
    rotateBoardTo(EDGE_TARGET_ROTATIONS[edgeIndex]);
  };

  const handleRotateBoard = (direction: 'left' | 'right') => {
    rotateBoard(direction);
    if (mode === 'writing') {
      const delta = direction === 'right' ? 90 : -90;
      const newBoardRotation = (boardRotation + delta + 360) % 360;
      requestEdgeFocus((4 - newBoardRotation / 90) % 4);
    }
  };

  useEffect(() => {
    if (correctSlots.length === 4) {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 } });
    }
  }, [correctSlots.length]);

  useEffect(() => {
    if (mode === 'writing') {
      requestEdgeFocus(0);
    }
  }, [mode]);

  useEffect(() => {
    if (!isMobile || mode !== 'guessing') {
      if (touchHoldTimeoutRef.current !== null) {
        window.clearTimeout(touchHoldTimeoutRef.current);
        touchHoldTimeoutRef.current = null;
      }
      pendingTouchDragRef.current = null;
      setActiveTouchDrag(null);
      return;
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (activeTouchDrag) {
        const activeTouch = Array.from(event.touches).find(
          (touch) => touch.identifier === activeTouchDrag.touchId
        );
        if (!activeTouch) return;

        event.preventDefault();
        setActiveTouchDrag((prev) =>
          prev
            ? {
                ...prev,
                clientX: activeTouch.clientX,
                clientY: activeTouch.clientY,
              }
            : prev
        );
        return;
      }

      const pending = pendingTouchDragRef.current;
      if (!pending) return;

      const touch = Array.from(event.touches).find((item) => item.identifier === pending.touchId);
      if (!touch) return;

      const distance = Math.hypot(touch.clientX - pending.startX, touch.clientY - pending.startY);
      if (distance > TOUCH_CANCEL_DISTANCE) {
        if (touchHoldTimeoutRef.current !== null) {
          window.clearTimeout(touchHoldTimeoutRef.current);
          touchHoldTimeoutRef.current = null;
        }
        pendingTouchDragRef.current = null;
      }
    };

    const clearTouchDrag = () => {
      if (touchHoldTimeoutRef.current !== null) {
        window.clearTimeout(touchHoldTimeoutRef.current);
        touchHoldTimeoutRef.current = null;
      }
      pendingTouchDragRef.current = null;
      setActiveTouchDrag(null);
    };

    const finishTouchDrag = (changedTouches: TouchList, isCanceled: boolean) => {
      const completedDrag = activeTouchDrag;
      if (completedDrag) {
        const changedTouch = Array.from(changedTouches).find(
          (touch) => touch.identifier === completedDrag.touchId
        );
        if (changedTouch) {
          const dropPos = { x: changedTouch.clientX, y: changedTouch.clientY };
          const targetSlot = getSlotFromPoint(
            dropPos.x,
            dropPos.y,
            boardRect,
            displayRotation
          );

          if (!isCanceled && targetSlot !== null) {
            moveCardToSlot(completedDrag.cardId, targetSlot, dropPos);
          } else if (completedDrag.source === 'board') {
            moveCardOffBoard(completedDrag.cardId, dropPos);
          }
        }
      }

      clearTouchDrag();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const pending = pendingTouchDragRef.current;
      if (pending) {
        const changedTouch = Array.from(event.changedTouches).find(
          (touch) => touch.identifier === pending.touchId
        );
        if (changedTouch) {
          event.preventDefault();
          // Short tap — treat as click/select
          handleCardClick(pending.cardId, pending.source, {
            x: changedTouch.clientX,
            y: changedTouch.clientY,
          });
          clearTouchDrag();
          return;
        }
      }

      if (activeTouchDrag) {
        event.preventDefault();
      }
      finishTouchDrag(event.changedTouches, false);
    };

    const handleTouchCancel = (event: TouchEvent) => {
      finishTouchDrag(event.changedTouches, true);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [activeTouchDrag, boardRect, displayRotation, handleCardClick, isMobile, mode, moveCardOffBoard, moveCardToSlot]);

  const handleCardTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
    cardId: string,
    source: TouchDragSource
  ) => {
    if (!isMobile || mode !== 'guessing') return;
    if (event.target instanceof Element && event.target.closest('button')) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    if (touchHoldTimeoutRef.current !== null) {
      window.clearTimeout(touchHoldTimeoutRef.current);
    }

    const pendingTouch: PendingTouchDrag = {
      cardId,
      source,
      touchId: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
      startX: touch.clientX,
      startY: touch.clientY,
    };

    pendingTouchDragRef.current = pendingTouch;
    touchHoldTimeoutRef.current = window.setTimeout(() => {
      setActiveTouchDrag({
        cardId: pendingTouch.cardId,
        source: pendingTouch.source,
        touchId: pendingTouch.touchId,
        clientX: pendingTouch.clientX,
        clientY: pendingTouch.clientY,
      });
      pendingTouchDragRef.current = null;
      touchHoldTimeoutRef.current = null;
    }, TOUCH_HOLD_DELAY);
  };

  const trayPadding = isMobile && mode === 'guessing' ? Math.ceil(320 * boardScale) + 32 : 24;
  const activeTouchCard = activeTouchDrag
    ? activeTouchDrag.cardId === decoyState.id
      ? decoyState
      : primeLookup[activeTouchDrag.cardId] ?? null
    : null;
  const touchPreviewRotation = activeTouchDrag?.source === 'board' ? boardRotation : 0;
  const actionControls = (
    <ActionControls
      mode={mode}
      onWritingSubmit={writingSubmit}
      writingSubmitEnabled={edges.every((e) => e.length > 0)}
      onGuessingSubmit={guessingSubmit}
      guessingSubmitEnabled={guessingSubmitEnabled}
      isWon={correctSlots.length === 4}
      onNextRound={nextRound}
      onGiveUp={nextRound}
      giveUpEnabled={mode === 'guessing' && correctSlots.length < 4 && slotCardIds.some((id) => id === null)}
    />
  );

  // Background click: deselect or eject selected board card to click position
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('button')) return;
    if (!selectedCardId) return;
    const isOnBoard = slotCardIds.some((id) => id === selectedCardId);
    if (isOnBoard) {
      moveCardOffBoard(selectedCardId, { x: e.clientX, y: e.clientY });
    }
    deselectCard();
  };

  // Offboard tray/table background click
  const handleOffboardAreaClick = (pos: { x: number; y: number }) => {
    if (!selectedCardId) return;
    const isOnBoard = slotCardIds.some((id) => id === selectedCardId);
    if (isOnBoard) {
      moveCardOffBoard(selectedCardId, pos);
    }
    deselectCard();
  };

  return (
    <Stack
      align="center"
      gap="xl"
      style={{
        minHeight: '100dvh',
        cursor: selectedCardId ? 'crosshair' : undefined,
        justifyContent: isMobile ? 'flex-start' : 'center',
        padding: `16px 16px ${trayPadding}px`,
        width: '100%',
        boxSizing: 'border-box',
      }}
      onClick={handleBackgroundClick}
    >
      {DEBUG && <ModeToggle mode={mode} setMode={setMode} />}

      {isMobile && mode === 'guessing' && actionControls}

      <RotationControls
        boardRotation={boardRotation}
        rotateBoard={handleRotateBoard}
        showLabel={DEBUG}
        boardScale={boardScale}
      />

      <div
        className={styles.scaleFrame}
        style={{ width: 760 * boardScale, height: 760 * boardScale }}
      >
        <div
          className={styles.viewportWrapper}
          style={{ transform: `scale(${boardScale})`, transformOrigin: 'top left' }}
        >
          <Board
            mode={mode}
            boardRef={boardRef}
            gridRef={gridRef}
            boardRect={boardRect}
            displayRotation={displayRotation}
            boardRotation={boardRotation}
            disableTransition={disableTransition}
            setDisableTransition={setDisableTransition}
            edges={edges}
            setEdges={setEdges}
            onEdgeFocus={handleEdgeFocus}
            focusEdgeIndex={focusEdgeIndex}
            focusRequestId={focusRequestId}
            cards={cards}
            slotCardIds={slotCardIds}
            primeLookup={primeLookup}
            decoyState={decoyState}
            setCardTopWord={setCardTopWord}
            handleDropOnSlot={handleDropOnSlot}
            handleDragStart={handleDragStart}
            onCardTouchStart={handleCardTouchStart}
            isMobile={isMobile}
            activeTouchCardId={activeTouchDrag?.cardId ?? null}
            correctSlots={correctSlots}
                    selectedCardId={selectedCardId}
                    handleCardClick={handleCardClick}
                    handleSlotClick={handleSlotClick}
          />
        </div>
      </div>

      {mode === 'guessing' && (
        <OffboardCards
          offboardCardIds={offboardCardIds}
          primeLookup={primeLookup}
          decoyState={decoyState}
          offboardCardPositions={offboardCardPositions}
          topOffboardCardId={topOffboardCardId}
          setCardTopWord={setCardTopWord}
          onDragStart={handleDragStart}
                    selectedCardId={selectedCardId}
                    handleCardClick={handleCardClick}
                    onBackgroundClick={handleOffboardAreaClick}
          onCardTouchStart={handleCardTouchStart}
          boardScale={boardScale}
          isMobile={isMobile}
          activeTouchCardId={activeTouchDrag?.cardId ?? null}
        />
      )}

      {mode === 'guessing' && <AdBanner />}

      {activeTouchCard && activeTouchDrag && (
        <div
          style={{
            position: 'fixed',
            left: activeTouchDrag.clientX - (BASE_CARD_SIZE * boardScale) / 2,
            top: activeTouchDrag.clientY - (BASE_CARD_SIZE * boardScale) / 2,
            width: BASE_CARD_SIZE * boardScale,
            height: BASE_CARD_SIZE * boardScale,
            pointerEvents: 'none',
            zIndex: 2000,
            opacity: 0.95,
          }}
        >
          <div
            style={{
              width: BASE_CARD_SIZE,
              height: BASE_CARD_SIZE,
              transform: `scale(${boardScale})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              style={{
                width: BASE_CARD_SIZE,
                height: BASE_CARD_SIZE,
                transform: `rotate(${touchPreviewRotation}deg)`,
                transformOrigin: 'center',
              }}
            >
              <WordCard
                id={activeTouchDrag.cardId}
                words={activeTouchCard.words}
                boardRotation={activeTouchDrag.source === 'board' ? displayRotation : 0}
                topWordIndex={activeTouchCard.topWordIndex}
                isRotationEnabled={false}
              />
            </div>
          </div>
        </div>
      )}

      {(!isMobile || mode !== 'guessing') && actionControls}

      <DebugCardList mode={mode} cards={cards} decoyState={decoyState} show={DEBUG} />

      {guessResult && <GuessResultDisplay result={guessResult} show={DEBUG} />}
    </Stack>
  );
};

export default GameBoard;
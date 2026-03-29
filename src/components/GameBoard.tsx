import React, { useEffect, useState } from 'react';
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
import { useGameState } from '../hooks/GameStateContext';
import { checkGuess } from '../utils/checkGuess';
import { useBoardScale } from '../hooks/useBoardScale';
import styles from './GameBoard.module.css';

const DEBUG = false; // import.meta.env.DEV;

interface GameBoardProps {
  wordBank: string[];
  initialEdges?: readonly [string, string, string, string];
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
    correctSlots,
    handleDropOnSlot,
    handleDragStart,
    writingSubmit,
    guessingSubmit,
    nextRound,
  } = useGameBoard(wordBank, initialEdges, isMobile);

  const EDGE_TARGET_ROTATIONS = [0, 270, 180, 90] as const;
  const [focusEdgeIndex, setFocusEdgeIndex] = useState<number | null>(null);
  const [focusRequestId, setFocusRequestId] = useState(0);

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

  const trayPadding = isMobile ? Math.ceil(320 * boardScale) + 48 : 24;

  return (
    <Stack
      align="center"
      gap="xl"
      style={{
        minHeight: '100dvh',
        justifyContent: isMobile ? 'flex-start' : 'center',
        padding: `16px 16px ${trayPadding}px`,
      }}
    >
      {DEBUG && <ModeToggle mode={mode} setMode={setMode} />}

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
            correctSlots={correctSlots}
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
          boardScale={boardScale}
          isMobile={isMobile}
        />
      )}

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

      <DebugCardList mode={mode} cards={cards} decoyState={decoyState} show={DEBUG} />

      {guessResult && <GuessResultDisplay result={guessResult} show={DEBUG} />}
    </Stack>
  );
};

export default GameBoard;
import React, { useEffect } from 'react';
import { Stack } from '@mantine/core';
import confetti from 'canvas-confetti';
import Board from './Board/Board';
import { useGameBoard } from './Board/useGameBoard';
import ModeToggle from './GameBoard/ModeToggle';
import RotationControls from './GameBoard/RotationControls';
import ActionControls from './GameBoard/ActionControls';
import DebugCardList from './GameBoard/DebugCardList';
import GuessResultDisplay from './GameBoard/GuessResultDisplay';
import { useGameState } from '../hooks/GameStateContext';
import { checkGuess } from '../utils/checkGuess';
import styles from './GameBoard.module.css';

const DEBUG = import.meta.env.DEV;

interface GameBoardProps {
  cardWords: readonly [
    readonly [string, string, string, string],
    readonly [string, string, string, string],
    readonly [string, string, string, string],
    readonly [string, string, string, string],
  ];
  initialEdges?: readonly [string, string, string, string];
}

const GameBoard: React.FC<GameBoardProps> = ({
  cardWords,
  initialEdges = ['Top', 'Right', 'Bottom', 'Left'] as const,
}) => {
  const { savedSetup, guessSubmission } = useGameState();
  const guessResult =
    savedSetup && guessSubmission ? checkGuess(savedSetup, guessSubmission) : null;

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
    setCardTopWord,
    correctSlots,
    handleDropOnSlot,
    handleDragStart,
    writingSubmit,
    guessingSubmit,
    nextRound,
  } = useGameBoard(cardWords, initialEdges);

  useEffect(() => {
    if (correctSlots.length === 4) {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 } });
    }
  }, [correctSlots.length]);

  return (
    <Stack align="center" gap="md">
      {DEBUG && <ModeToggle mode={mode} setMode={setMode} />}

      <Stack gap="xs" align="center" className={styles.controlsContainer}>
        <RotationControls boardRotation={boardRotation} rotateBoard={rotateBoard} showLabel={DEBUG} />
        <ActionControls
          mode={mode}
          onWritingSubmit={writingSubmit}
          onGuessingSubmit={guessingSubmit}
          guessingSubmitEnabled={guessingSubmitEnabled}
          isWon={correctSlots.length === 4}
          onNextRound={nextRound}
        />
      </Stack>

      <div className={styles.viewportWrapper}>
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
          cards={cards}
          slotCardIds={slotCardIds}
          primeLookup={primeLookup}
          decoyState={decoyState}
          offboardCardIds={offboardCardIds}
          offboardCardPositions={offboardCardPositions}
          topOffboardCardId={topOffboardCardId}
          setCardTopWord={setCardTopWord}
          handleDropOnSlot={handleDropOnSlot}
          handleDragStart={handleDragStart}
          correctSlots={correctSlots}
        />
      </div>

      <DebugCardList mode={mode} cards={cards} decoyState={decoyState} show={DEBUG} />

      {guessResult && <GuessResultDisplay result={guessResult} show={DEBUG} />}
    </Stack>
  );
};

export default GameBoard;
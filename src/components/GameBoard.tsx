import React from 'react';
import { Stack, Text } from '@mantine/core';
import Board from './Board/Board';
import { useGameBoard } from './Board/useGameBoard';
import ModeToggle from './GameBoard/ModeToggle';
import RotationControls from './GameBoard/RotationControls';
import ActionControls from './GameBoard/ActionControls';

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
    handleDropOnSlot,
    handleDragStart,
    writingSubmit,
    guessingSubmit,
  } = useGameBoard(cardWords, initialEdges);

  return (
    <Stack align="center" gap="md">
      <Text size="xl" fw={600}>
        Game Board
      </Text>

      <ModeToggle mode={mode} setMode={setMode} />

      <Stack gap="xs" align="center" style={{ width: '100%' }}>
        <RotationControls boardRotation={boardRotation} rotateBoard={rotateBoard} />
        <ActionControls
          mode={mode}
          onWritingSubmit={writingSubmit}
          onGuessingSubmit={guessingSubmit}
          guessingSubmitEnabled={guessingSubmitEnabled}
        />
      </Stack>

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
      />
    </Stack>
  );
};

export default GameBoard;
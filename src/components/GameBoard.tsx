import React from 'react';
import { Button, Center, Stack, Text } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import OffboardCards from './OffboardCards';
import BoardGrid from './Board/BoardGrid';
import { useGameBoard } from './Board/useGameBoard';

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

      <Center>
        <Button
          color={mode === 'writing' ? 'blue' : 'gray'}
          onClick={() => setMode('writing')}
          mr="xs"
        >
          Writing Mode
        </Button>
        <Button color={mode === 'guessing' ? 'blue' : 'gray'} onClick={() => setMode('guessing')}>
          Guessing Mode
        </Button>
      </Center>

      <Stack gap="xs" align="center" style={{ width: '100%' }}>
        <Center style={{ width: '640px', justifyContent: 'space-between' }}>
          <Button size="xs" onClick={() => rotateBoard('left')} aria-label="Rotate board left">
            <IconArrowBackUp size={16} />
          </Button>
          <Text mx="xs">Board Rotation: {boardRotation}°</Text>
          <Button size="xs" onClick={() => rotateBoard('right')} aria-label="Rotate board right">
            <IconArrowForwardUp size={16} />
          </Button>
        </Center>

        {mode === 'writing' ? (
          <Button onClick={writingSubmit} size="sm" mt="xs">
            Save Setup
          </Button>
        ) : (
          <Button onClick={guessingSubmit} size="sm" mt="xs" disabled={!guessingSubmitEnabled}>
            Submit Guess
          </Button>
        )}
      </Stack>

      <div
        ref={boardRef}
        style={{
          position: 'relative',
          width: '760px',
          height: '760px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <BoardGrid
          mode={mode}
          cards={cards}
          slotCardIds={slotCardIds}
          primeLookup={primeLookup}
          decoyState={decoyState}
          edges={edges}
          setEdges={setEdges}
          displayRotation={displayRotation}
          boardRotation={boardRotation}
          disableTransition={disableTransition}
          setDisableTransition={setDisableTransition}
          boardRect={boardRect}
          gridRef={gridRef}
          handleDropOnSlot={handleDropOnSlot}
          setCardTopWord={setCardTopWord}
          handleDragStart={handleDragStart}
        />

        {mode === 'guessing' && (
          <OffboardCards
            offboardCardIds={offboardCardIds}
            primeLookup={primeLookup}
            decoyState={decoyState}
            offboardCardPositions={offboardCardPositions}
            topOffboardCardId={topOffboardCardId}
            boardRotation={boardRotation}
            setCardTopWord={setCardTopWord}
            onDragStart={handleDragStart}
          />
        )}
      </div>
    </Stack>
  );
};

export default GameBoard;
import React, { useMemo, useState } from 'react';
import { Button, Center, Stack, Text } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import WordCard from './WordCard';

interface GameBoardProps {
  cardWords: readonly [
    readonly [string, string, string, string],
    readonly [string, string, string, string],
    readonly [string, string, string, string],
    readonly [string, string, string, string],
  ];
  initialEdges?: readonly [string, string, string, string];
}

const GameBoard: React.FC<GameBoardProps> = ({ cardWords, initialEdges = ['Top', 'Right', 'Bottom', 'Left'] as const }) => {
  const [boardRotation, setBoardRotation] = useState(0); // logical 0, 90, 180, 270
  const [displayRotation, setDisplayRotation] = useState(0); // animating absolute degrees
  const [edges, setEdges] = useState<readonly [string, string, string, string]>(initialEdges);
  const [disableTransition, setDisableTransition] = useState(false);

  const rotateBoard = (direction: 'left' | 'right') => {
    const delta = direction === 'right' ? 90 : -90;
    setBoardRotation((prev) => (prev + delta + 360) % 360);
    setDisplayRotation((prev) => prev + delta);
    setDisableTransition(false);
  };

  const edgeInputs = useMemo(() => {
    const [top, right, bottom, left] = edges;
    return (
      <>
        <input
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180px',
            textAlign: 'center',
            zIndex: 10,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          value={top}
          onChange={(e) => setEdges([e.target.value, right, bottom, left] as const)}
          aria-label="Top edge label"
        />

        <input
          style={{
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translate(50%, -50%) rotate(90deg)',
            width: '180px',
            textAlign: 'center',
            zIndex: 10,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          value={right}
          onChange={(e) => setEdges([top, e.target.value, bottom, left] as const)}
          aria-label="Right edge label"
        />

        <input
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translate(-50%, 50%) rotate(180deg)',
            width: '180px',
            textAlign: 'center',
            zIndex: 10,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          value={bottom}
          onChange={(e) => setEdges([top, right, e.target.value, left] as const)}
          aria-label="Bottom edge label"
        />

        <input
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translate(-50%, -50%) rotate(270deg)',
            width: '180px',
            textAlign: 'center',
            zIndex: 10,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          value={left}
          onChange={(e) => setEdges([top, right, bottom, e.target.value] as const)}
          aria-label="Left edge label"
        />
      </>
    );
  }, [edges]);

  return (
    <Stack align="center" gap="md">
      <Text size="xl" fw={600}>Game Board</Text>
      <Stack gap="xs" align="center" style={{ width: '100%' }}>
        <Center>
          <Button size="xs" onClick={() => rotateBoard('left')} aria-label="Rotate board left">
            <IconArrowBackUp size={16} />
          </Button>
          <Text mx="xs">Board Rotation: {boardRotation}°</Text>
          <Button size="xs" onClick={() => rotateBoard('right')} aria-label="Rotate board right">
            <IconArrowForwardUp size={16} />
          </Button>
        </Center>
      </Stack>

      <div
        style={{
          position: 'relative',
          width: '760px',
          height: '760px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
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
              setDisplayRotation(boardRotation);
            }
          }}
        >
          {cardWords.map((wordset, idx) => (
            <WordCard key={idx} words={wordset} />
          ))}

          {edgeInputs}
        </div>
      </div>
    </Stack>
  );
};

export default GameBoard;

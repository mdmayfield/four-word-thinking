import React, { useEffect, useMemo, useState } from 'react';
import { Button, Center, Stack, Text } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import WordCard from './WordCard';
import { useGameState } from '../hooks/GameStateContext';
import { CardState } from '../hooks/GameStateTypes';

interface GameBoardProps {
  cardWords: readonly [
    readonly [string, string, string, string],
    readonly [string, string, string, string],
    readonly [string, string, string, string],
    readonly [string, string, string, string],
  ];
  initialEdges?: readonly [string, string, string, string];
}

type Mode = 'writing' | 'guessing';

const decoyCard: CardState = {
  id: 'decoy',
  words: ['Decoy', 'Bait', 'Lure', 'Trap'],
  topWordIndex: 0,
};

const GameBoard: React.FC<GameBoardProps> = ({ cardWords, initialEdges = ['Top', 'Right', 'Bottom', 'Left'] as const }) => {
  const { savedSetup, setSavedSetup, setGuessSubmission } = useGameState();
  const [mode, setMode] = useState<Mode>('writing');
  const [boardRotation, setBoardRotation] = useState(0); // logical 0, 90, 180, 270
  const [displayRotation, setDisplayRotation] = useState(0); // animating absolute degrees
  const [edges, setEdges] = useState<readonly [string, string, string, string]>(initialEdges);
  const [disableTransition, setDisableTransition] = useState(false);
  const [cards, setCards] = useState<CardState[]>(
    cardWords.map((words, i) => ({ id: `card-${i}`, words, topWordIndex: 0 }))
  );
  const [slotCardIds, setSlotCardIds] = useState<(string | null)[]>(cards.map((c) => c.id));
  const [offboardCardIds, setOffboardCardIds] = useState<string[]>([]);
  const [offboardCardPositions, setOffboardCardPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (mode === 'guessing' && savedSetup) {
      setSlotCardIds(savedSetup.cards.map((c) => c.id));
      setOffboardCardIds([decoyCard.id]);
      setOffboardCardPositions({});
    }
  }, [mode, savedSetup]);

  useEffect(() => {
    const handleWindowDrop = (event: DragEvent) => {
      event.preventDefault();
      if (!event.dataTransfer) return;
      const payload = event.dataTransfer.getData('application/json');
      if (!payload) return;
      const { cardId } = JSON.parse(payload) as { cardId: string };
      if (!cardId) return;

      if (!mode || mode !== 'guessing') return;

      setSlotCardIds((prev) => prev.map((id) => (id === cardId ? null : id)));
      setOffboardCardIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
      setOffboardCardPositions((prev) => ({
        ...prev,
        [cardId]: { x: event.clientX, y: event.clientY },
      }));
    };

    const handleWindowDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragover', handleWindowDragOver);

    return () => {
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragover', handleWindowDragOver);
    };
  }, [mode]);

  const primeLookup = useMemo<Record<string, CardState>>(() => {
    const base = savedSetup ? savedSetup.cards : cards;
    return Object.fromEntries(base.map((card) => [card.id, card])) as Record<string, CardState>;
  }, [cards, savedSetup]);

  const rotateBoard = (direction: 'left' | 'right') => {
    const delta = direction === 'right' ? 90 : -90;
    setBoardRotation((prev) => (prev + delta + 360) % 360);
    setDisplayRotation((prev) => prev + delta);
    setDisableTransition(false);
  };

  const setCardTopWord = (cardId: string, direction: 'left' | 'right') => {
    const delta = direction === 'right' ? -1 : 1;
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, topWordIndex: (card.topWordIndex + delta + 4) % 4 }
          : card
      )
    );

    if (savedSetup) {
      setSavedSetup({
        ...savedSetup,
        cards: savedSetup.cards.map((card) =>
          card.id === cardId
            ? { ...card, topWordIndex: (card.topWordIndex + delta + 4) % 4 }
            : card
        ),
      });
    }
  };

  const handleDropOnSlot = (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = event.dataTransfer.getData('application/json');
    if (!payload) return;
    const { cardId } = JSON.parse(payload) as { cardId: string };

    let droppedOutCard: string | null = null;
    setSlotCardIds((prevSlots) => {
      const newSlots = [...prevSlots];
      const existing = newSlots[targetSlot];
      if (existing === cardId) return prevSlots;
      if (existing) droppedOutCard = existing;

      const sourceSlot = newSlots.findIndex((id) => id === cardId);
      if (sourceSlot !== -1) newSlots[sourceSlot] = null;

      newSlots[targetSlot] = cardId;
      return newSlots;
    });


    setOffboardCardIds((prevOff) => {
      const withoutDragged = prevOff.filter((id) => id !== cardId);
      if (droppedOutCard) {
        return [...withoutDragged, droppedOutCard];
      }
      return withoutDragged;
    });
    setOffboardCardPositions((prev) => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  };



  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, cardId: string) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ cardId }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const writingSubmit = () => {
    const answer = window.confirm('Save this setup and switch to guessing mode?');
    if (!answer) return;

    setSavedSetup({ edges, cards, boardRotation });
    setMode('guessing');
  };

  const guessingSubmitEnabled = mode === 'guessing' && slotCardIds.every((id) => id !== null);

  const guessingSubmit = () => {
    if (!guessingSubmitEnabled) return;

    const payload = {
      slotCardIds,
      offboardCardIds,
      edges,
      boardRotation,
    };

    setGuessSubmission(payload);
    console.log('Guess submit payload', payload);
  };

  const [top, right, bottom, left] = edges;

  const edgeInputs = (
    <>
      <input
        style={{
          position: 'absolute',
          top: '-2rem',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '420px',
          height: '64px',
          fontSize: '3rem',
          textAlign: 'center',
          zIndex: 10,
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
        value={top}
        onChange={(e) => setEdges([e.target.value, right, bottom, left] as const)}
        aria-label="Top edge label"
        disabled={mode === 'guessing'}
      />
      <input
        style={{
          position: 'absolute',
          top: '50%',
          right: '-2rem',
          transform: 'translate(50%, -50%) rotate(90deg)',
          width: '420px',
          height: '64px',
          fontSize: '3rem',
          textAlign: 'center',
          zIndex: 10,
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
        value={right}
        onChange={(e) => setEdges([top, e.target.value, bottom, left] as const)}
        aria-label="Right edge label"
        disabled={mode === 'guessing'}
      />
      <input
        style={{
          position: 'absolute',
          bottom: '-2rem',
          left: '50%',
          transform: 'translate(-50%, 50%) rotate(180deg)',
          width: '420px',
          height: '64px',
          fontSize: '3rem',
          textAlign: 'center',
          zIndex: 10,
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
        value={bottom}
        onChange={(e) => setEdges([top, right, e.target.value, left] as const)}
        aria-label="Bottom edge label"
        disabled={mode === 'guessing'}
      />
      <input
        style={{
          position: 'absolute',
          top: '50%',
          left: '-2rem',
          transform: 'translate(-50%, -50%) rotate(270deg)',
          width: '420px',
          height: '64px',
          fontSize: '3rem',
          textAlign: 'center',
          zIndex: 10,
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
        value={left}
        onChange={(e) => setEdges([top, right, bottom, e.target.value] as const)}
        aria-label="Left edge label"
        disabled={mode === 'guessing'}
      />
    </>
  );

  // in guessing mode we use savedSetup + decoy directly from primeLookup

  return (
    <Stack align="center" gap="md">
      <Text size="xl" fw={600}>Game Board</Text>

      <Center>
        <Button
          color={mode === 'writing' ? 'blue' : 'gray'}
          onClick={() => setMode('writing')}
          mr="xs"
        >
          Writing Mode
        </Button>
        <Button
          color={mode === 'guessing' ? 'blue' : 'gray'}
          onClick={() => setMode('guessing')}
        >
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
                        words={primeLookup[cardId]?.words ?? decoyCard.words}
                        boardRotation={displayRotation}
                        topWordIndex={primeLookup[cardId]?.topWordIndex ?? 0}
                        isRotationEnabled={true}
                        onRotate={(direction) => setCardTopWord(cardId, direction)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cardId)}
                      />
                    ) : (
                      <Text>Drop card here</Text>
                    )}
                  </div>
                );
              })}

          {edgeInputs}
        </div>

        {mode === 'guessing' && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {offboardCardIds.map((cardId) => {
              const card = primeLookup[cardId] ?? decoyCard;
              const pos = offboardCardPositions[cardId] ?? { x: 40, y: 640 };
              return (
                <div
                  key={`off-abs-${cardId}`}
                  style={{
                    position: 'fixed',
                    left: Math.max(0, Math.min(window.innerWidth - 320, pos.x - 160)),
                    top: Math.max(0, Math.min(window.innerHeight - 320, pos.y - 160)),
                    width: '320px',
                    height: '320px',
                    pointerEvents: 'auto',
                    zIndex: 1001,
                  }}
                >
                  <WordCard
                    id={cardId}
                    words={card.words}
                    boardRotation={displayRotation}
                    topWordIndex={card.topWordIndex}
                    isRotationEnabled={true}
                    onRotate={(direction) => setCardTopWord(cardId, direction)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, cardId)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Stack>
  );
};

export default GameBoard;

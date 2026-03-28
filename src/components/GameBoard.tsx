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

  useEffect(() => {
    if (mode === 'guessing' && savedSetup) {
      setSlotCardIds(savedSetup.cards.map((c) => c.id));
      setOffboardCardIds([decoyCard.id]);
    }
  }, [mode, savedSetup]);

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
  };

  const handleDropOnOffboard = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData('application/json');
    if (!payload) return;
    const { cardId } = JSON.parse(payload) as { cardId: string };

    setSlotCardIds((prev) => prev.map((id) => (id === cardId ? null : id)));
    setOffboardCardIds((prev) => {
      if (!prev.includes(cardId)) {
        return [...prev, cardId];
      }
      return prev;
    });
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, cardId: string) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ cardId }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const writingSubmit = () => {
    setSavedSetup({ edges, cards, boardRotation });
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
          top: '-1.5rem',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '360px',
          height: '48px',
          fontSize: '1.5rem',
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
          right: '-1.5rem',
          transform: 'translate(50%, -50%) rotate(90deg)',
          width: '360px',
          height: '48px',
          fontSize: '1.5rem',
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
          bottom: '-1.5rem',
          left: '50%',
          transform: 'translate(-50%, 50%) rotate(180deg)',
          width: '360px',
          height: '48px',
          fontSize: '1.5rem',
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
          left: '-1.5rem',
          transform: 'translate(-50%, -50%) rotate(270deg)',
          width: '360px',
          height: '48px',
          fontSize: '1.5rem',
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
                      border: '2px dashed #bbb',
                      boxSizing: 'border-box',
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
            onDrop={handleDropOnOffboard}
            onDragOver={(e) => e.preventDefault()}
            style={{
              marginTop: '680px',
              width: '640px',
              minHeight: '160px',
              backgroundColor: '#f3f3f3',
              border: '2px dashed #aaa',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '8px',
              boxSizing: 'border-box',
            }}
          >
            <Text size="sm" fw={500} style={{ width: '100%' }}>
              Offboard cards (drag to board or keep here)
            </Text>
            {offboardCardIds.map((cardId) => {
              const card = primeLookup[cardId] ?? decoyCard;
              return (
                <WordCard
                  key={`off-${cardId}`}
                  id={cardId}
                  words={card.words}
                  boardRotation={displayRotation}
                  topWordIndex={card.topWordIndex}
                  isRotationEnabled={true}
                  onRotate={(direction) => setCardTopWord(cardId, direction)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, cardId)}
                />
              );
            })}
          </div>
        )}

        {!savedSetup && mode === 'guessing' && (
          <Text color="red">Please set up the board in writing mode first and hit Save Setup before guessing.</Text>
        )}
      </div>
    </Stack>
  );
};

export default GameBoard;

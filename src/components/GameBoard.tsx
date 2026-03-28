import React, { useEffect, useMemo, useState } from 'react';
import { Button, Center, Stack, Text } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import WordCard from './WordCard';
import EdgeInputs from './EdgeInputs';
import OffboardCards from './OffboardCards';
import { useGameState } from '../hooks/GameStateContext';
import { CardState } from '../hooks/GameStateTypes';
import {
  Mode,
  baseDecoy,
  getSlotFromPoint,
  getShuffledOffboardPositions,
  shuffleArray,
} from './gameBoardUtils';

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
  const { savedSetup, setSavedSetup, setGuessSubmission } = useGameState();
  const [mode, setMode] = useState<Mode>('writing');
  const [boardRotation, setBoardRotation] = useState(0); // logical 0, 90, 180, 270
  const [decoyState, setDecoyState] = useState<CardState>(baseDecoy);
  const [displayRotation, setDisplayRotation] = useState(0); // animating absolute degrees
  const [edges, setEdges] = useState<readonly [string, string, string, string]>(initialEdges);
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);
  const boardRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [disableTransition, setDisableTransition] = useState(false);
  const [cards, setCards] = useState<CardState[]>(
    cardWords.map((words, i) => ({ id: `card-${i}`, words, topWordIndex: 0 }))
  );
  const [slotCardIds, setSlotCardIds] = useState<(string | null)[]>(cards.map((c) => c.id));
  const [offboardCardIds, setOffboardCardIds] = useState<string[]>([]);
  const [offboardCardPositions, setOffboardCardPositions] = useState<Record<string, { x: number; y: number }>>({});
  const dragOffsetsRef = React.useRef<Record<string, { x: number; y: number }>>({});
  const [topOffboardCardId, setTopOffboardCardId] = useState<string | null>(null);
  const [hasInitializedGuessing, setHasInitializedGuessing] = useState(false);

  useEffect(() => {
    const updateBoardRect = () => {
      if (gridRef.current) {
        setBoardRect(gridRef.current.getBoundingClientRect());
      }
    };

    updateBoardRect();
    window.addEventListener('resize', updateBoardRect);
    return () => {
      window.removeEventListener('resize', updateBoardRect);
    };
  }, [gridRef]);

  useEffect(() => {
    if (mode === 'guessing' && savedSetup && boardRect && !hasInitializedGuessing) {
      setSlotCardIds([null, null, null, null]);
      const ids = savedSetup.cards.map((c) => c.id);
      const allIds = shuffleArray([...ids, decoyState.id]);
      setOffboardCardIds(allIds);
      setOffboardCardPositions(getShuffledOffboardPositions(allIds, boardRect));
      setHasInitializedGuessing(true);
    }
  }, [mode, savedSetup, decoyState, boardRect, hasInitializedGuessing]);

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

      const offset = dragOffsetsRef.current[cardId] || { x: 160, y: 160 };
      const rawX = event.clientX - offset.x;
      const rawY = event.clientY - offset.y;
      setOffboardCardPositions((prev) => ({
        ...prev,
        [cardId]: {
          x: Math.max(0, Math.min(window.innerWidth - 320, rawX)),
          y: Math.max(0, Math.min(window.innerHeight - 320, rawY)),
        },
      }));

      delete dragOffsetsRef.current[cardId];
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
    const boardSteps = ((boardRotation % 360) + 360) % 360 / 90;

    const isOnBoard = slotCardIds.some((id) => id === cardId);

    const normalize = (x: number) => (x + 4) % 4;

    const updateFn = (topWordIndex: number) => {
      if (isOnBoard) {
        return normalize(topWordIndex + delta);
      }
      // offboard: user rotates card in screen coordinates
      const screenTop = normalize(topWordIndex - boardSteps);
      const newScreenTop = normalize(screenTop + delta);
      return normalize(newScreenTop + boardSteps);
    };

    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, topWordIndex: updateFn(card.topWordIndex) }
          : card
      )
    );

    if (savedSetup) {
      setSavedSetup({
        ...savedSetup,
        cards: savedSetup.cards.map((card) =>
          card.id === cardId
            ? { ...card, topWordIndex: updateFn(card.topWordIndex) }
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
    const dropPos = { x: event.clientX, y: event.clientY };
    const incomingCardOldPos = offboardCardPositions[cardId];

    const sourceSlot = slotCardIds.findIndex((id) => id === cardId);

    setSlotCardIds((prevSlots) => {
      const newSlots = [...prevSlots];
      const existing = newSlots[targetSlot];
      if (existing === cardId) return prevSlots;

      if (existing && sourceSlot !== -1) {
        // slot-to-slot swap, no offboard position changes required
        newSlots[sourceSlot] = existing;
        newSlots[targetSlot] = cardId;
        return newSlots;
      }

      if (existing) {
        // external -> occupied slot; outgoing card should go to incoming card old position
        droppedOutCard = existing;
      }

      if (sourceSlot !== -1) {
        // moving from another slot to this slot
        newSlots[sourceSlot] = null;
      }

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
      if (droppedOutCard) {
        const fallbackPos = {
          x: Math.max(0, Math.min(window.innerWidth - 320, dropPos.x)),
          y: Math.max(0, Math.min(window.innerHeight - 320, dropPos.y)),
        };
        const targetPos = incomingCardOldPos || fallbackPos;

        next[droppedOutCard] = {
          x: Math.max(0, Math.min(window.innerWidth - 320, targetPos.x)),
          y: Math.max(0, Math.min(window.innerHeight - 320, targetPos.y)),
        };
      }
      return next;
    });
  };



  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, cardId: string) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ cardId }));
    event.dataTransfer.effectAllowed = 'move';

    const currentPos = offboardCardPositions[cardId];
    const offset = currentPos
      ? { x: event.clientX - currentPos.x, y: event.clientY - currentPos.y }
      : { x: 160, y: 160 };

    dragOffsetsRef.current[cardId] = offset;
    setTopOffboardCardId(cardId);
  };

  const writingSubmit = () => {
    // const answer = window.confirm('Save this setup and switch to guessing mode?');
    // if (!answer) return;

    const shuffledCards = shuffleArray(cards);
    const randomizedCards = shuffledCards.map((card) => ({
      ...card,
      topWordIndex: Math.floor(Math.random() * 4),
    }));

    const randomizedDecoy = {
      ...baseDecoy,
      topWordIndex: Math.floor(Math.random() * 4),
    };

    setDecoyState(randomizedDecoy);
    setSavedSetup({ edges, cards: randomizedCards, boardRotation });
    setHasInitializedGuessing(false);
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
        <div
          ref={gridRef}
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
          onDrop={(e) => {
            e.preventDefault();
            const targetSlot = getSlotFromPoint(e.clientX, e.clientY, boardRect, displayRotation);
            if (targetSlot !== null) {
              handleDropOnSlot(e as React.DragEvent<HTMLDivElement>, targetSlot);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
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
                        words={primeLookup[cardId]?.words ?? decoyState.words}
                        boardRotation={displayRotation}
                        topWordIndex={primeLookup[cardId]?.topWordIndex ?? decoyState.topWordIndex}
                        isRotationEnabled={true}
                        onRotate={(direction) => setCardTopWord(cardId, direction)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cardId)}
                      />
                    ) : (
                      <Text
                        style={{
                          transform: `rotate(${-displayRotation}deg)`,
                          transformOrigin: 'center',
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        Drop card here
                      </Text>
                    )}
                  </div>
                );
              })}

          <EdgeInputs edges={edges} setEdges={setEdges} mode={mode} />
        </div>

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

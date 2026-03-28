import React, { useEffect, useMemo, useState } from 'react';
import { useGameState } from '../../hooks/GameStateContext';
import { CardState } from '../../hooks/GameStateTypes';
import { baseDecoy, shuffleArray } from '../gameBoardUtils';
import { Mode, EdgeTuple } from './types';
import { useBoardDimensions } from './useBoardDimensions';
import { useGuessingSetup } from './useGuessingSetup';
import { useWindowDropHandlers } from './useWindowDropHandlers';

interface UseGameBoardResult {
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  boardRef: React.RefObject<HTMLDivElement | null>;
  gridRef: React.RefObject<HTMLDivElement | null>;
  boardRect: DOMRect | null;
  displayRotation: number;
  boardRotation: number;
  disableTransition: boolean;
  setDisableTransition: React.Dispatch<React.SetStateAction<boolean>>;
  edges: EdgeTuple;
  setEdges: React.Dispatch<React.SetStateAction<EdgeTuple>>;
  cards: CardState[];
  slotCardIds: (string | null)[];
  offboardCardIds: string[];
  offboardCardPositions: Record<string, { x: number; y: number }>;
  topOffboardCardId: string | null;
  decoyState: CardState;
  guessingSubmitEnabled: boolean;
  primeLookup: Record<string, CardState>;
  rotateBoard: (direction: 'left' | 'right') => void;
  setCardTopWord: (cardId: string, direction: 'left' | 'right') => void;
  handleDropOnSlot: (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  writingSubmit: () => void;
  guessingSubmit: () => void;
}

export const useGameBoard = (
  cardWords: readonly [
    readonly [string, string, string, string],
    readonly [string, string, string, string],
    readonly [string, string, string, string],
    readonly [string, string, string, string]
  ],
  initialEdges: EdgeTuple = ['Top', 'Right', 'Bottom', 'Left'] as const
): UseGameBoardResult => {
  const { savedSetup, setSavedSetup, setGuessSubmission } = useGameState();

  const [mode, setMode] = useState<Mode>('writing');
  const [boardRotation, setBoardRotation] = useState(0);
  const [displayRotation, setDisplayRotation] = useState(0);
  const [disableTransition, setDisableTransition] = useState(false);
  const [edges, setEdges] = useState<EdgeTuple>(initialEdges);
  const boardRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const boardRect = useBoardDimensions(gridRef);
  const [decoyState, setDecoyState] = useState<CardState>(baseDecoy);
  const [cards, setCards] = useState<CardState[]>(
    cardWords.map((words, i) => ({ id: `card-${i}`, words, topWordIndex: 0 }))
  );
  const [slotCardIds, setSlotCardIds] = useState<(string | null)[]>(cards.map((c) => c.id));
  const [offboardCardIds, setOffboardCardIds] = useState<string[]>([]);
  const [offboardCardPositions, setOffboardCardPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const dragOffsetsRef = React.useRef<Record<string, { x: number; y: number }>>({});
  const [topOffboardCardId, setTopOffboardCardId] = useState<string | null>(null);
  const [hasInitializedGuessing, setHasInitializedGuessing] = useState(false);

  useGuessingSetup({
    mode,
    savedSetup,
    decoyState,
    boardRect,
    hasInitializedGuessing,
    setSlotCardIds,
    setOffboardCardIds,
    setOffboardCardPositions,
    setHasInitializedGuessing,
  });

  useWindowDropHandlers({
    mode,
    dragOffsetsRef,
    setSlotCardIds,
    setOffboardCardIds,
    setOffboardCardPositions,
  });

  useEffect(() => {
    const handleWindowDrop = (event: DragEvent) => {
      event.preventDefault();
      if (!event.dataTransfer || mode !== 'guessing') return;

      const payload = event.dataTransfer.getData('application/json');
      if (!payload) return;

      const { cardId } = JSON.parse(payload) as { cardId: string };
      if (!cardId) return;

      const wasOnBoard = slotCardIds.some((id) => id === cardId);
      if (wasOnBoard) {
        const rotation = ((boardRotation % 360) + 360) % 360;
        const shift = (4 - rotation / 90) % 4;

        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === cardId
              ? { ...card, topWordIndex: (card.topWordIndex + shift) % 4 }
              : card
          )
        );
      }

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
    return Object.fromEntries(base.map((card) => [card.id, card]));
  }, [cards, savedSetup]);

  const rotateBoard = (direction: 'left' | 'right') => {
    const delta = direction === 'right' ? 90 : -90;
    setBoardRotation((prev) => (prev + delta + 360) % 360);
    setDisplayRotation((prev) => prev + delta);
    setDisableTransition(false);
  };

  const setCardTopWord = (cardId: string, direction: 'left' | 'right') => {
    const delta = direction === 'right' ? -1 : 1;
    const normalize = (x: number) => (x + 4) % 4;

    const updateFn = (topWordIndex: number) => normalize(topWordIndex + delta);

    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, topWordIndex: updateFn(card.topWordIndex) } : card
      )
    );

    if (savedSetup) {
      setSavedSetup({
        ...savedSetup,
        cards: savedSetup.cards.map((card) =>
          card.id === cardId ? { ...card, topWordIndex: updateFn(card.topWordIndex) } : card
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
    if (!cardId) return;

    const isOffBoard = offboardCardIds.includes(cardId);
    if (isOffBoard) {
      const rotation = ((boardRotation % 360) + 360) % 360;
      const shift = (4 - rotation / 90) % 4;

      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === cardId
            ? { ...card, topWordIndex: (card.topWordIndex + shift) % 4 }
            : card
        )
      );
    }

    let droppedOutCard: string | null = null;
    const dropPos = { x: event.clientX, y: event.clientY };
    const incomingCardOldPos = offboardCardPositions[cardId];

    const sourceSlot = slotCardIds.findIndex((id) => id === cardId);

    setSlotCardIds((prevSlots) => {
      const newSlots = [...prevSlots];
      const existing = newSlots[targetSlot];
      if (existing === cardId) return prevSlots;

      if (existing && sourceSlot !== -1) {
        newSlots[sourceSlot] = existing;
        newSlots[targetSlot] = cardId;
        return newSlots;
      }

      if (existing) droppedOutCard = existing;
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

    const isOnBoard = slotCardIds.some((id) => id === cardId);

    // Set a custom drag image for board cards to preserve rotation.
    if (isOnBoard && event.currentTarget instanceof HTMLElement) {
      const cloned = event.currentTarget.cloneNode(true) as HTMLElement;
      cloned.style.position = 'fixed';
      cloned.style.top = '-9999px';
      cloned.style.left = '-9999px';
      cloned.style.zIndex = '-9999';
      cloned.style.transform = `rotate(${boardRotation}deg)`;
      document.body.appendChild(cloned);

      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      event.dataTransfer.setDragImage(cloned, x, y);

      setTimeout(() => {
        if (cloned.parentElement) cloned.parentElement.removeChild(cloned);
      }, 0);
    }

    const currentPos = offboardCardPositions[cardId];
    const offset = currentPos
      ? { x: event.clientX - currentPos.x, y: event.clientY - currentPos.y }
      : { x: 160, y: 160 };

    dragOffsetsRef.current[cardId] = offset;
    setTopOffboardCardId(cardId);
  };

  const writingSubmit = () => {
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

  return {
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
  };
};

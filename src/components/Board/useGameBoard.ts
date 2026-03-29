import React, { useMemo, useState } from 'react';
import { useGameState } from '../../hooks/GameStateContext';
import { CardState } from '../../hooks/GameStateTypes';
import { shuffleArray, placeEjectedCards } from '../gameBoardUtils';
import { generateCardSet } from '../../utils/generateCards';
import { checkGuess } from '../../utils/checkGuess';
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
  rotateBoardTo: (targetBoardRotation: number) => void;
  setCardTopWord: (cardId: string, direction: 'left' | 'right') => void;
  moveCardToSlot: (cardId: string, targetSlot: number, dropPos: { x: number; y: number }) => void;
  moveCardOffBoard: (cardId: string, dropPos: { x: number; y: number }) => void;
  handleDropOnSlot: (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  correctSlots: number[];
  isWon: boolean;
  selectedCardId: string | null;
  deselectCard: () => void;
  handleCardClick: (cardId: string, source: 'board' | 'offboard', pos: { x: number; y: number }) => void;
  handleSlotClick: (slotIndex: number, pos: { x: number; y: number }) => void;
  writingSubmit: () => void;
  guessingSubmit: () => void;
  nextRound: () => void;
}

export const useGameBoard = (
  wordBank: string[],
  initialEdges: EdgeTuple = ['Top', 'Right', 'Bottom', 'Left'] as const,
  isMobile = false
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
  const [{ cardWords: initCardWords, decoyWords: initDecoyWords }] = useState(() =>
    generateCardSet(wordBank)
  );
  const [decoyState, setDecoyState] = useState<CardState>(() => ({
    id: 'decoy',
    words: initDecoyWords,
    topWordIndex: 0,
  }));
  const [cards, setCards] = useState<CardState[]>(() =>
    initCardWords.map((words, i) => ({ id: `card-${i}`, words, topWordIndex: 0 }))
  );
  const [slotCardIds, setSlotCardIds] = useState<(string | null)[]>(cards.map((c) => c.id));
  const [offboardCardIds, setOffboardCardIds] = useState<string[]>([]);
  const [offboardCardPositions, setOffboardCardPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const dragOffsetsRef = React.useRef<Record<string, { x: number; y: number }>>({});
  const [topOffboardCardId, setTopOffboardCardId] = useState<string | null>(null);
  const [hasInitializedGuessing, setHasInitializedGuessing] = useState(false);
  const [correctSlots, setCorrectSlots] = useState<number[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const deselectCard = () => setSelectedCardId(null);

  const handleSlotClick = (slotIndex: number, pos: { x: number; y: number }) => {
    if (!selectedCardId || correctSlots.includes(slotIndex)) return;
    moveCardToSlot(selectedCardId, slotIndex, pos);
    setSelectedCardId(null);
  };

  const handleCardClick = (
    cardId: string,
    source: 'board' | 'offboard',
    pos: { x: number; y: number }
  ) => {
    if (mode !== 'guessing') return;
    const cardSlot = slotCardIds.indexOf(cardId);
    if (cardSlot !== -1 && correctSlots.includes(cardSlot)) return;

    if (selectedCardId === cardId) {
      setSelectedCardId(null);
      return;
    }

    if (selectedCardId !== null) {
      const selectedSlot = slotCardIds.indexOf(selectedCardId);
      const targetedSlot = source === 'board' ? cardSlot : -1;

      if (source === 'board' && targetedSlot !== -1 && !correctSlots.includes(targetedSlot)) {
        // Selected card onto a board slot occupied by the tapped card → swap/place
        moveCardToSlot(selectedCardId, targetedSlot, pos);
        setSelectedCardId(null);
      } else if (source === 'offboard' && selectedSlot !== -1) {
        // Selected card is on board, tapped card is offboard → place tapped onto selected's slot
        moveCardToSlot(cardId, selectedSlot, pos);
        setSelectedCardId(null);
      } else {
        // Both offboard → switch selection
        setSelectedCardId(cardId);
      }
      return;
    }

    setSelectedCardId(cardId);
  };

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
    isMobile,
    boardRotation,
    slotCardIds,
    decoyId: decoyState.id,
    dragOffsetsRef,
    setDecoyState,
    setCards,
    setSlotCardIds,
    setOffboardCardIds,
    setOffboardCardPositions,
  });

  const primeLookup = useMemo<Record<string, CardState>>(() => {
    return Object.fromEntries(cards.map((card) => [card.id, card]));
  }, [cards]);

  const rotateBoard = (direction: 'left' | 'right') => {
    const delta = direction === 'right' ? 90 : -90;
    setBoardRotation((prev) => (prev + delta + 360) % 360);
    setDisplayRotation((prev) => prev + delta);
    setDisableTransition(false);
  };

  const rotateBoardTo = (targetBoardRotation: number) => {
    const normalized = ((targetBoardRotation % 360) + 360) % 360;
    const deltaCw = (normalized - boardRotation + 360) % 360;
    const shortestDelta = deltaCw > 180 ? deltaCw - 360 : deltaCw;
    if (shortestDelta === 0) return;
    setBoardRotation(normalized);
    setDisplayRotation((prev) => prev + shortestDelta);
    setDisableTransition(false);
  };

  const setCardTopWord = (cardId: string, direction: 'left' | 'right') => {
    const delta = direction === 'right' ? -1 : 1;
    const update = (topWordIndex: number) => ((topWordIndex + delta) % 4 + 4) % 4;

    if (cardId === decoyState.id) {
      setDecoyState((prev) => ({ ...prev, topWordIndex: update(prev.topWordIndex) }));
    } else {
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, topWordIndex: update(card.topWordIndex) } : card
        )
      );
    }
  };

  const moveCardToSlot = (cardId: string, targetSlot: number, dropPos: { x: number; y: number }) => {
    if (!cardId || correctSlots.includes(targetSlot)) return;

    const isOffBoard = offboardCardIds.includes(cardId);
    const rotation = ((boardRotation % 360) + 360) % 360;
    const steps = rotation / 90;

    if (isOffBoard) {
      const toBoard = (idx: number) => (idx + steps) % 4;
      if (cardId === decoyState.id) {
        setDecoyState((prev) => ({ ...prev, topWordIndex: toBoard(prev.topWordIndex) }));
      } else {
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === cardId
              ? { ...card, topWordIndex: toBoard(card.topWordIndex) }
              : card
          )
        );
      }
    }

    let droppedOutCard: string | null = null;
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

    if (droppedOutCard) {
      const toScreen = (idx: number) => ((idx - steps) % 4 + 4) % 4;
      const outId = droppedOutCard;
      if (outId === decoyState.id) {
        setDecoyState((prev) => ({ ...prev, topWordIndex: toScreen(prev.topWordIndex) }));
      } else {
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === outId
              ? { ...card, topWordIndex: toScreen(card.topWordIndex) }
              : card
          )
        );
      }
    }

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
          x: isMobile ? 0 : Math.max(0, Math.min(window.innerWidth - 320, dropPos.x)),
          y: isMobile ? 0 : Math.max(0, Math.min(window.innerHeight - 320, dropPos.y)),
        };

        const targetPos = incomingCardOldPos || fallbackPos;

        next[droppedOutCard] = {
          x: isMobile ? 0 : Math.max(0, Math.min(window.innerWidth - 320, targetPos.x)),
          y: isMobile ? 0 : Math.max(0, Math.min(window.innerHeight - 320, targetPos.y)),
        };
      }

      return next;
    });
  };

  const moveCardOffBoard = (cardId: string, dropPos: { x: number; y: number }) => {
    const wasOnBoard = slotCardIds.some((id) => id === cardId);
    if (!wasOnBoard) return;

    const rotation = ((boardRotation % 360) + 360) % 360;
    const steps = rotation / 90;
    const toScreen = (idx: number) => ((idx - steps) % 4 + 4) % 4;

    if (cardId === decoyState.id) {
      setDecoyState((prev) => ({ ...prev, topWordIndex: toScreen(prev.topWordIndex) }));
    } else {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === cardId
            ? { ...card, topWordIndex: toScreen(card.topWordIndex) }
            : card
        )
      );
    }

    setSlotCardIds((prev) => prev.map((id) => (id === cardId ? null : id)));
    setOffboardCardIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
    setOffboardCardPositions((prev) => ({
      ...prev,
      [cardId]: {
        x: isMobile ? 0 : Math.max(0, Math.min(window.innerWidth - 320, dropPos.x - 160)),
        y: isMobile ? 0 : Math.max(0, Math.min(window.innerHeight - 320, dropPos.y - 160)),
      },
    }));
  };

  const handleDropOnSlot = (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = event.dataTransfer.getData('application/json');
    if (!payload) return;

    const { cardId } = JSON.parse(payload) as { cardId: string };
    if (!cardId) return;

    moveCardToSlot(cardId, targetSlot, { x: event.clientX, y: event.clientY });
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, cardId: string) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ cardId }));
    event.dataTransfer.effectAllowed = 'move';

    const isOnBoard = slotCardIds.some((id) => id === cardId);

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
    setSelectedCardId(null);
    setSavedSetup({ edges, cards: cards.map((c) => ({ ...c })), boardRotation });

    const shuffledCards = shuffleArray(cards);
    const randomizedCards = shuffledCards.map((card) => ({
      ...card,
      topWordIndex: Math.floor(Math.random() * 4),
    }));

    const randomizedDecoy = {
      ...decoyState,
      topWordIndex: Math.floor(Math.random() * 4),
    };

    setCards(randomizedCards);
    setDecoyState(randomizedDecoy);
    setHasInitializedGuessing(false);
    setCorrectSlots([]);
    setMode('guessing');
  };

  const nextRound = () => {
    setSelectedCardId(null);
    const { cardWords: newCardWords, decoyWords: newDecoyWords } = generateCardSet(wordBank);
    setCards(newCardWords.map((words, i) => ({ id: `card-${i}`, words, topWordIndex: 0 })));
    setDecoyState({ id: 'decoy', words: newDecoyWords, topWordIndex: 0 });
    setSlotCardIds(newCardWords.map((_, i) => `card-${i}`));
    setOffboardCardIds([]);
    setOffboardCardPositions({});
    setCorrectSlots([]);
    setBoardRotation(0);
    setDisplayRotation(0);
    setDisableTransition(true);
    setEdges(initialEdges);
    setHasInitializedGuessing(false);
    setMode('writing');
  };

  const isWon = correctSlots.length === 4;

  const guessingSubmitEnabled =
    mode === 'guessing' && slotCardIds.every((id) => id !== null) && !isWon;

  const guessingSubmit = () => {
    if (!guessingSubmitEnabled || !savedSetup) return;
    setSelectedCardId(null);

    const slotTopWordIndices = slotCardIds.map((cardId) => {
      if (cardId === null) return null;
      if (cardId === decoyState.id) return decoyState.topWordIndex;
      return primeLookup[cardId]?.topWordIndex ?? null;
    });

    const submission = {
      slotCardIds,
      slotTopWordIndices,
      offboardCardIds,
      edges,
      boardRotation,
    };

    setGuessSubmission(submission);

    const result = checkGuess(savedSetup, submission);
    const newCorrectSlots = result.slotResults
      .map((r, i) => (r.cardCorrect && r.orientationCorrect ? i : null))
      .filter((i): i is number => i !== null);
    setCorrectSlots(newCorrectSlots);

    const cardsToRemove: string[] = [];
    const newSlotCardIds = slotCardIds.map((cardId, i) => {
      const slotResult = result.slotResults[i];
      if (slotResult.cardCorrect && slotResult.orientationCorrect) return cardId;
      if (cardId) cardsToRemove.push(cardId);
      return null;
    });

    if (cardsToRemove.length === 0) return;

    setCards((prev) =>
      prev.map((card) =>
        cardsToRemove.includes(card.id)
          ? { ...card, topWordIndex: Math.floor(Math.random() * 4) }
          : card
      )
    );
    if (cardsToRemove.includes(decoyState.id)) {
      setDecoyState((prev) => ({ ...prev, topWordIndex: Math.floor(Math.random() * 4) }));
    }

    setSlotCardIds(newSlotCardIds);
    setOffboardCardIds((prev) => [...prev, ...cardsToRemove]);
    const newPositions = placeEjectedCards(cardsToRemove, boardRect, offboardCardPositions);
    setOffboardCardPositions((prev) => ({ ...prev, ...newPositions }));
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
    rotateBoardTo,
    setCardTopWord,
    moveCardToSlot,
    moveCardOffBoard,
    correctSlots,
    isWon,
    selectedCardId,
    deselectCard,
    handleCardClick,
    handleSlotClick,
    handleDropOnSlot,
    handleDragStart,
    writingSubmit,
    guessingSubmit,
    nextRound,
  };
};
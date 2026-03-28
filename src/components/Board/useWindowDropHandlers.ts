import { useEffect, useRef } from 'react';
import { CardState } from '../../hooks/GameStateTypes';

interface WindowDropHandlersParams {
  mode: 'writing' | 'guessing';
  boardRotation: number;
  slotCardIds: (string | null)[];
  decoyId: string;
  dragOffsetsRef: React.MutableRefObject<Record<string, { x: number; y: number }>>;
  setDecoyState: React.Dispatch<React.SetStateAction<CardState>>;
  setCards: React.Dispatch<React.SetStateAction<CardState[]>>;
  setSlotCardIds: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  setOffboardCardIds: React.Dispatch<React.SetStateAction<string[]>>;
  setOffboardCardPositions: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }>>>;
}

export const useWindowDropHandlers = ({
  mode,
  boardRotation,
  slotCardIds,
  decoyId,
  dragOffsetsRef,
  setDecoyState,
  setCards,
  setSlotCardIds,
  setOffboardCardIds,
  setOffboardCardPositions,
}: WindowDropHandlersParams) => {
  // Use refs to avoid stale closures without re-registering listeners on every state change
  const boardRotationRef = useRef(boardRotation);
  boardRotationRef.current = boardRotation;
  const slotCardIdsRef = useRef(slotCardIds);
  slotCardIdsRef.current = slotCardIds;

  useEffect(() => {
    const handleWindowDrop = (event: DragEvent) => {
      event.preventDefault();
      if (!event.dataTransfer || mode !== 'guessing') return;

      const payload = event.dataTransfer.getData('application/json');
      if (!payload) return;

      const { cardId } = JSON.parse(payload) as { cardId: string };
      if (!cardId) return;

      // Convert board-relative → screen-relative when a card leaves the board
      const wasOnBoard = slotCardIdsRef.current.some((id) => id === cardId);
      if (wasOnBoard) {
        const rotation = ((boardRotationRef.current % 360) + 360) % 360;
        const steps = rotation / 90;
        const toScreen = (idx: number) => ((idx - steps) % 4 + 4) % 4;

        if (cardId === decoyId) {
          setDecoyState((prev) => ({ ...prev, topWordIndex: toScreen(prev.topWordIndex) }));
        } else {
          setCards((prev) =>
            prev.map((card) =>
              card.id === cardId
                ? { ...card, topWordIndex: toScreen(card.topWordIndex) }
                : card
            )
          );
        }
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
  }, [mode, decoyId, dragOffsetsRef, setDecoyState, setCards, setSlotCardIds, setOffboardCardIds, setOffboardCardPositions]);
};

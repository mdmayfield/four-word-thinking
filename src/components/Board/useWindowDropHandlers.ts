import { useEffect } from 'react';

interface WindowDropHandlersParams {
  mode: 'writing' | 'guessing';
  dragOffsetsRef: React.MutableRefObject<Record<string, { x: number; y: number }>>;
  setSlotCardIds: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  setOffboardCardIds: React.Dispatch<React.SetStateAction<string[]>>;
  setOffboardCardPositions: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }>>>;
}

export const useWindowDropHandlers = ({
  mode,
  dragOffsetsRef,
  setSlotCardIds,
  setOffboardCardIds,
  setOffboardCardPositions,
}: WindowDropHandlersParams) => {
  useEffect(() => {
    const handleWindowDrop = (event: DragEvent) => {
      event.preventDefault();
      if (!event.dataTransfer || mode !== 'guessing') return;

      const payload = event.dataTransfer.getData('application/json');
      if (!payload) return;

      const { cardId } = JSON.parse(payload) as { cardId: string };
      if (!cardId) return;

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
  }, [mode, dragOffsetsRef, setSlotCardIds, setOffboardCardIds, setOffboardCardPositions]);
};

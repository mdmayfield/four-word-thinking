import { CardState } from '../hooks/GameStateTypes';

export type Mode = 'writing' | 'guessing';

export const baseDecoy: CardState = {
  id: 'decoy',
  words: ['Decoy', 'Bait', 'Lure', 'Trap'],
  topWordIndex: 0,
};

export const shuffleArray = <T,>(input: T[]): T[] => {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const getShuffledOffboardPositions = (
  ids: string[],
  boardRect: DOMRect | null
): Record<string, { x: number; y: number }> => {
  if (!boardRect) {
    return ids.reduce(
      (acc, id) => ({ ...acc, [id]: { x: 20, y: 20 } }),
      {} as Record<string, { x: number; y: number }>
    );
  }

  const windowW = window.innerWidth;
  const windowH = window.innerHeight;
  const cardWidth = 320;
  const cardHeight = 320;
  const sideMargin = 20;

  const innerBoardWidth = 640;
  const innerLeft = boardRect.left + (boardRect.width - innerBoardWidth) / 2;
  const innerRight = innerLeft + innerBoardWidth;

  const leftZoneXMin = Math.max(sideMargin, innerLeft - cardWidth - 120);
  const leftZoneXMax = Math.max(leftZoneXMin, innerLeft - cardWidth - 80);
  const rightZoneXMin = Math.min(windowW - cardWidth - sideMargin, innerRight + 80);
  const rightZoneXMax = Math.min(windowW - cardWidth - sideMargin, innerRight + 120);

  const makeDistribution = () => {
    const option = Math.random() < 0.5 ? [2, 3] : [3, 2];
    if (ids.length === 2) return [1, 1];
    if (ids.length === 3) return [1, 2];
    if (ids.length === 4) return [2, 2];
    return option;
  };

  const [leftCount, rightCount] = makeDistribution();

  const shuffledIds = shuffleArray(ids);

  const arrangeY = (count: number): number[] => {
    if (count === 0) return [];
    const totalCardHeight = cardHeight * count;
    const spacing = Math.min(30, (windowH - totalCardHeight - sideMargin * 2) / Math.max(1, count - 1));
    const totalUsedHeight = totalCardHeight + spacing * Math.max(0, count - 1);
    const startY = Math.max(sideMargin, (windowH - totalUsedHeight) / 2);

    return Array.from({ length: count }, (_, i) => {
      const baseline = startY + i * (cardHeight + spacing);
      const jitter = (Math.random() - 0.5) * 20;
      return Math.max(sideMargin, Math.min(windowH - cardHeight - sideMargin, baseline + jitter));
    });
  };

  const leftY = arrangeY(leftCount);
  const rightY = arrangeY(rightCount);

  const chooseX = (min: number, max: number) => {
    if (max <= min) return min;
    return min + Math.random() * (max - min);
  };

  const positions: Record<string, { x: number; y: number }> = {};
  let idIndex = 0;

  for (let i = 0; i < leftCount; i += 1) {
    const id = shuffledIds[idIndex++];
    positions[id] = { x: chooseX(leftZoneXMin, leftZoneXMax), y: leftY[i] };
  }

  for (let i = 0; i < rightCount; i += 1) {
    const id = shuffledIds[idIndex++];
    positions[id] = { x: chooseX(rightZoneXMin, rightZoneXMax), y: rightY[i] };
  }

  return positions;
};

export const getSlotFromPoint = (
  clientX: number,
  clientY: number,
  boardRect: DOMRect | null,
  displayRotation: number
): number | null => {
  if (!boardRect) return null;

  const boardSize = 640;
  const localX = clientX - boardRect.left;
  const localY = clientY - boardRect.top;
  const normalized = ((displayRotation % 360) + 360) % 360;

  let x = localX;
  let y = localY;

  if (normalized === 90) {
    x = localY;
    y = boardSize - localX;
  } else if (normalized === 180) {
    x = boardSize - localX;
    y = boardSize - localY;
  } else if (normalized === 270) {
    x = boardSize - localY;
    y = localX;
  }

  if (x < 0 || y < 0 || x > boardSize || y > boardSize) return null;

  const col = Math.min(1, Math.max(0, Math.floor(x / (boardSize / 2))));
  const row = Math.min(1, Math.max(0, Math.floor(y / (boardSize / 2))));

  return row * 2 + col;
};

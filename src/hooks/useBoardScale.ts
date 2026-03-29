import { useEffect, useState } from 'react';

const BASE_BOARD_SIZE = 760;
const HORIZONTAL_PADDING = 32;

const getBoardScale = () => {
  const usableWidth = Math.max(320, window.innerWidth - HORIZONTAL_PADDING);
  return Math.min(1, usableWidth / BASE_BOARD_SIZE);
};

export const useBoardScale = () => {
  const [boardScale, setBoardScale] = useState(() => getBoardScale());

  useEffect(() => {
    const updateBoardScale = () => {
      setBoardScale(getBoardScale());
    };

    updateBoardScale();
    window.addEventListener('resize', updateBoardScale);
    window.visualViewport?.addEventListener('resize', updateBoardScale);

    return () => {
      window.removeEventListener('resize', updateBoardScale);
      window.visualViewport?.removeEventListener('resize', updateBoardScale);
    };
  }, []);

  return { boardScale, isMobile: boardScale < 1 };
};
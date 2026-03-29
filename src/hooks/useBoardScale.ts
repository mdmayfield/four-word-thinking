import { useEffect, useState } from 'react';

const BASE_BOARD_SIZE = 900;
const HORIZONTAL_PADDING = 24;
const RESERVED_HEIGHT = 240;

const getViewportSize = () => ({
  width: window.visualViewport?.width ?? window.innerWidth,
  height: window.visualViewport?.height ?? window.innerHeight,
});

const getBoardScale = () => {
  const viewport = getViewportSize();
  const usableWidth = Math.max(320, viewport.width - HORIZONTAL_PADDING);
  const usableHeight = Math.max(320, viewport.height - RESERVED_HEIGHT);

  return Math.min(1, usableWidth / BASE_BOARD_SIZE, usableHeight / BASE_BOARD_SIZE);
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
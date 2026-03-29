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

// Use tray layout when viewport is taller than 80% of its width (portrait-ish)
const getIsMobile = () => {
  const viewport = getViewportSize();
  return viewport.height > 0.8 * viewport.width;
};

export const useBoardScale = () => {
  const [boardScale, setBoardScale] = useState(() => getBoardScale());
  const [isMobile, setIsMobile] = useState(() => getIsMobile());

  useEffect(() => {
    const update = () => {
      setBoardScale(getBoardScale());
      setIsMobile(getIsMobile());
    };

    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return { boardScale, isMobile };
};
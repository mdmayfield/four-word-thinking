import { useEffect, useState } from 'react';

export const useBoardDimensions = (gridRef: React.RefObject<HTMLDivElement | null>) => {
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateBoardRect = () => {
      if (gridRef.current) {
        setBoardRect(gridRef.current.getBoundingClientRect());
      }
    };

    updateBoardRect();
    window.addEventListener('resize', updateBoardRect);
    return () => window.removeEventListener('resize', updateBoardRect);
  }, [gridRef]);

  return boardRect;
};

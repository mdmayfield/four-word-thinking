import { useState, useCallback } from 'react';

type Direction = 'left' | 'right';

interface UseCardRotationArgs {
  isRotationEnabled: boolean;
  onRotate?: (direction: Direction) => void;
  duration?: number;
}

export const useCardRotation = ({
  isRotationEnabled,
  onRotate,
  duration = 300,
}: UseCardRotationArgs) => {
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleRotate = useCallback(
    (direction: Direction) => {
      if (!isRotationEnabled) return;
      setIsRotating(true);
      const degrees = direction === 'right' ? 90 : -90;
      setRotation(degrees);

      setTimeout(() => {
        setIsRotating(false);
        setRotation(0);
        onRotate?.(direction);
      }, duration);
    },
    [isRotationEnabled, onRotate, duration]
  );

  return {
    rotation,
    isHovered,
    setIsHovered,
    isRotating,
    handleRotate,
  };
};

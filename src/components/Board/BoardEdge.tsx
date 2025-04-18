import { KeyboardEvent } from 'react';
import { EdgeWords } from '../../types/board';
import { Text, Box } from '@mantine/core';

interface BoardEdgeProps {
  position: keyof EdgeWords;
  text: string;
  isEditable: boolean;
  onChange?: (position: keyof EdgeWords, newValue: string) => void;
}

export const BoardEdge = ({
  position,
  text,
  isEditable,
  onChange
}: BoardEdgeProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isEditable || !onChange) return;
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const getPositionStyles = (pos: keyof EdgeWords): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute' as const,
      padding: '1rem',
      width: '200px',
      textAlign: 'center',
      fontSize: 'clamp(12px, 4vw, 24px)',
    };

    const positionStyles: Record<keyof EdgeWords, React.CSSProperties> = {
      top: {
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      right: {
        top: '50%',
        right: 'rem',  // Adjust this value to move text in/out
        transform: 'translateY(-50%) rotate(90deg)',
        transformOrigin: 'center center',
      },
      bottom: {
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%) rotate(180deg)',
      },
      left: {
        top: '50%',
        left: '-1.5rem',  // Adjust this value to move text in/out
        transform: 'translateY(-50%) rotate(-90deg)',
        transformOrigin: 'center center',
      },
    };

    return { ...baseStyles, ...positionStyles[pos] };
  };

  return (
    <Box
      component={isEditable ? 'div' : 'p'}
      contentEditable={isEditable}
      onBlur={(e) => onChange?.(position, e.currentTarget.textContent || '')}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning={true}
      style={getPositionStyles(position)}
    >
      <Text
        truncate="end"
        size="xl"
        fw={500}
        ta="center"
      >
        {text}
      </Text>
    </Box>
  );
};

import { KeyboardEvent } from 'react';
import { EdgeWords } from '../../types/board';
import styles from './styles/BoardEdge.module.css';

interface BoardEdgeProps {
  position: keyof EdgeWords;
  text: string;
  isEditable: boolean;
  onChange?: (position: keyof EdgeWords, newValue: string) => void;
}

export const BoardEdge: React.FC<BoardEdgeProps> = ({
  position,
  text,
  isEditable,
  onChange
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isEditable || !onChange) return;
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div 
      className={`${styles.edge} ${styles[position]}`}
      contentEditable={isEditable}
      onBlur={(e) => onChange?.(position, e.currentTarget.textContent || '')}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning={true}
    >
      {text}
    </div>
  );
};

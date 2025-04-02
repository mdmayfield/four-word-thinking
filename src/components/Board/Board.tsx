import { BoardProps } from '../../types/board';
import { BoardEdge } from './BoardEdge';
import { CardGrid } from './CardGrid';
import styles from './styles/Board.module.css';

export const Board: React.FC<BoardProps> = ({ 
  words, 
  isEditable = false,
  onWordChange 
}) => {
  return (
    <div className={styles.boardContainer}>
      <BoardEdge 
        position="top" 
        text={words.top}
        isEditable={isEditable}
        onChange={onWordChange}
      />
      <BoardEdge 
        position="right" 
        text={words.right}
        isEditable={isEditable}
        onChange={onWordChange}
      />
      <BoardEdge 
        position="bottom" 
        text={words.bottom}
        isEditable={isEditable}
        onChange={onWordChange}
      />
      <BoardEdge 
        position="left" 
        text={words.left}
        isEditable={isEditable}
        onChange={onWordChange}
      />
      <CardGrid />
    </div>
  );
};
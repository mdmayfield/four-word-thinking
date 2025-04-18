import { BoardProps } from '../../types/board';
import { BoardEdge } from './BoardEdge';
import { CardGrid } from './CardGrid';
import { Paper, Box } from '@mantine/core';

export const Board = ({ 
  words, 
  isEditable = false,
  onWordChange 
}: BoardProps) => {
  return (
    <Paper 
      shadow="sm" 
      p="md" 
      withBorder
      style={{
        width: '400px',
        height: '400px',
        position: 'relative',
        margin: '2rem auto'
      }}
    >
      <Box 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
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
      </Box>
    </Paper>
  );
};
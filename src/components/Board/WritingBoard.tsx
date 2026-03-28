import React from 'react';
import WordCard from '../WordCard';
import { CardState } from '../../hooks/GameStateTypes';

interface WritingBoardProps {
  cards: CardState[];
  displayRotation: number;
}

const WritingBoard: React.FC<WritingBoardProps> = ({ cards, displayRotation }) => {
  return (
    <>
      {cards.map((card) => (
        <WordCard
          key={card.id}
          id={card.id}
          words={card.words}
          boardRotation={displayRotation}
          topWordIndex={card.topWordIndex}
          isRotationEnabled={false}
          onRotate={() => {}}
        />
      ))}
    </>
  );
};

export default WritingBoard;

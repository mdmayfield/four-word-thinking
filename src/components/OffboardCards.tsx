import React from 'react';
import WordCard from './WordCard';
import { CardState } from '../hooks/GameStateTypes';
import styles from './OffboardCards.module.css';

type Direction = 'left' | 'right';

interface OffboardCardsProps {
  offboardCardIds: string[];
  primeLookup: Record<string, CardState>;
  decoyState: CardState;
  offboardCardPositions: Record<string, { x: number; y: number }>;
  topOffboardCardId: string | null;
  boardRotation: number;
  setCardTopWord: (cardId: string, direction: Direction) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
}

const OffboardCards: React.FC<OffboardCardsProps> = ({
  offboardCardIds,
  primeLookup,
  decoyState,
  offboardCardPositions,
  topOffboardCardId,
  boardRotation,
  setCardTopWord,
  onDragStart,
}) => {
  return (
    <div className={styles.offboardRoot}>

      {offboardCardIds.map((cardId) => {
        const card = cardId === decoyState.id ? decoyState : primeLookup[cardId] ?? decoyState;
        const pos = offboardCardPositions[cardId] ?? { x: 40, y: 640 };
        const zIndex = cardId === topOffboardCardId ? 1002 : 1001;

        const normalizedTop =
          (card.topWordIndex - ((boardRotation % 360 + 360) % 360) / 90 + 4) % 4;

        return (
          <div
            key={`off-abs-${cardId}`}
            className={styles.offboardCard}
            style={{
              left: Math.max(0, Math.min(window.innerWidth - 320, pos.x)),
              top: Math.max(0, Math.min(window.innerHeight - 320, pos.y)),
              zIndex,
            }}
          >
            <WordCard
              id={cardId}
              words={card.words}
              boardRotation={0}
              topWordIndex={normalizedTop}
              isRotationEnabled={true}
              onRotate={(direction) => setCardTopWord(cardId, direction)}
              draggable
              onDragStart={(e) => onDragStart(e, cardId)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default OffboardCards;

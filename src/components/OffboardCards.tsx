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
  setCardTopWord: (cardId: string, direction: Direction) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  onCardTouchStart?: (
    event: React.TouchEvent<HTMLDivElement>,
    cardId: string,
    source: 'board' | 'offboard'
  ) => void;
  boardScale: number;
  isMobile: boolean;
  activeTouchCardId?: string | null;
  selectedCardId?: string | null;
  handleCardClick?: (cardId: string, source: 'board' | 'offboard', pos: { x: number; y: number }) => void;
  onBackgroundClick?: (pos: { x: number; y: number }) => void;
}

const OffboardCards: React.FC<OffboardCardsProps> = ({
  offboardCardIds,
  primeLookup,
  decoyState,
  offboardCardPositions,
  topOffboardCardId,
  setCardTopWord,
  onDragStart,
  onCardTouchStart,
  boardScale,
  isMobile,
  activeTouchCardId,
  selectedCardId,
  handleCardClick,
  onBackgroundClick,
}) => {
  if (isMobile) {
    const scaledCardSize = 320 * boardScale;

    return (
      <div
        className={styles.mobileTray}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onBackgroundClick?.({ x: e.clientX, y: e.clientY });
          }
        }}
      >
        {offboardCardIds.map((cardId) => {
          const card = cardId === decoyState.id ? decoyState : primeLookup[cardId] ?? decoyState;

          return (
            <div
              key={`off-tray-${cardId}`}
              className={styles.mobileCardShell}
              style={{ width: scaledCardSize, height: scaledCardSize }}
                          onClick={(e) => {
                            if (e.target instanceof Element && e.target.closest('button')) return;
                            e.stopPropagation();
                            handleCardClick?.(cardId, 'offboard', { x: e.clientX, y: e.clientY });
                          }}
            >
              <div
                className={styles.mobileCardInner}
                style={{ transform: `scale(${boardScale})`, transformOrigin: 'top left' }}
              >
                <WordCard
                  id={cardId}
                  words={card.words}
                  boardRotation={0}
                  topWordIndex={card.topWordIndex}
                  isRotationEnabled={true}
                  onRotate={(direction) => setCardTopWord(cardId, direction)}
                  draggable={false}
                  onTouchStart={
                    onCardTouchStart
                      ? (event) => onCardTouchStart(event, cardId, 'offboard')
                      : undefined
                  }
                  isDragging={activeTouchCardId === cardId}
                                  isSelected={selectedCardId === cardId}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.offboardRoot}>
      {offboardCardIds.map((cardId) => {
        const card = cardId === decoyState.id ? decoyState : primeLookup[cardId] ?? decoyState;
        const pos = offboardCardPositions[cardId] ?? { x: 40, y: 640 };
        const zIndex = cardId === topOffboardCardId ? 1002 : 1001;

        return (
          <div
            key={`off-abs-${cardId}`}
            className={styles.offboardCard}
            style={{
              left: Math.max(0, Math.min(window.innerWidth - 320, pos.x)),
              top: Math.max(0, Math.min(window.innerHeight - 320, pos.y)),
              zIndex,
            }}
                      onClick={(e) => {
                        if (e.target instanceof Element && e.target.closest('button')) return;
                        e.stopPropagation();
                        handleCardClick?.(cardId, 'offboard', { x: e.clientX, y: e.clientY });
                      }}
          >
            <WordCard
              id={cardId}
              words={card.words}
              boardRotation={0}
              topWordIndex={card.topWordIndex}
              isRotationEnabled={true}
              onRotate={(direction) => setCardTopWord(cardId, direction)}
              draggable
              onDragStart={(e) => onDragStart(e, cardId)}
                          isSelected={selectedCardId === cardId}
            />
          </div>
        );
      })}
    </div>
  );
};

export default OffboardCards;

import React from 'react';
import { CardState } from '../../hooks/GameStateTypes';

export type Mode = 'writing' | 'guessing';

export type EdgeTuple = readonly [string, string, string, string];

export interface BoardCardProps {
  cards: CardState[];
  slotCardIds: (string | null)[];
  primeLookup: Record<string, CardState>;
  decoyState: CardState;
  displayRotation: number;
  setCardTopWord: (cardId: string, direction: 'left' | 'right') => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  handleDropOnSlot: (event: React.DragEvent<HTMLDivElement>, targetSlot: number) => void;
}

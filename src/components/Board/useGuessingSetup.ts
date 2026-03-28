import { useEffect } from 'react';
import { CardState } from '../../hooks/GameStateTypes';
import { getShuffledOffboardPositions, shuffleArray } from '../gameBoardUtils';

interface UseGuessingSetupParams {
  mode: 'writing' | 'guessing';
  savedSetup: { cards: CardState[] } | null;
  decoyState: CardState;
  boardRect: DOMRect | null;
  hasInitializedGuessing: boolean;
  setSlotCardIds: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  setOffboardCardIds: React.Dispatch<React.SetStateAction<string[]>>;
  setOffboardCardPositions: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }>>>;
  setHasInitializedGuessing: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useGuessingSetup = ({
  mode,
  savedSetup,
  decoyState,
  boardRect,
  hasInitializedGuessing,
  setSlotCardIds,
  setOffboardCardIds,
  setOffboardCardPositions,
  setHasInitializedGuessing,
}: UseGuessingSetupParams) => {
  useEffect(() => {
    if (mode !== 'guessing' || !savedSetup || !boardRect || hasInitializedGuessing) {
      return;
    }

    setSlotCardIds([null, null, null, null]);

    const ids = savedSetup.cards.map((c) => c.id);
    const allIds = shuffleArray([...ids, decoyState.id]);

    setOffboardCardIds(allIds);
    setOffboardCardPositions(getShuffledOffboardPositions(allIds, boardRect));
    setHasInitializedGuessing(true);
  }, [
    mode,
    savedSetup,
    decoyState,
    boardRect,
    hasInitializedGuessing,
    setSlotCardIds,
    setOffboardCardIds,
    setOffboardCardPositions,
    setHasInitializedGuessing,
  ]);
};

import React, { createContext, useContext, useState } from 'react';

export type CardState = {
  id: string;
  words: readonly [string, string, string, string];
  topWordIndex: number;
};

export type SavedSetup = {
  edges: readonly [string, string, string, string];
  cards: CardState[];
  boardRotation: number;
};

export type GuessSubmission = {
  slotCardIds: (string | null)[];
  offboardCardIds: string[];
  edges: readonly [string, string, string, string];
  boardRotation: number;
};

interface GameStateContextValue {
  savedSetup: SavedSetup | null;
  setSavedSetup: (setup: SavedSetup) => void;
  guessSubmission: GuessSubmission | null;
  setGuessSubmission: (submission: GuessSubmission) => void;
}

const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);

export const GameStateProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const [savedSetup, setSavedSetup] = useState<SavedSetup | null>(null);
  const [guessSubmission, setGuessSubmission] = useState<GuessSubmission | null>(null);

  return (
    <GameStateContext.Provider value={{ savedSetup, setSavedSetup, guessSubmission, setGuessSubmission }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
};

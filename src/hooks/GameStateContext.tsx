/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { SavedSetup, GuessSubmission } from './GameStateTypes';

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

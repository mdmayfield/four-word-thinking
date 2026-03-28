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

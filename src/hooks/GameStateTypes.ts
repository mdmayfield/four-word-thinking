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
  slotTopWordIndices: (number | null)[];
  offboardCardIds: string[];
  edges: readonly [string, string, string, string];
  boardRotation: number;
};

export type SlotResult = {
  cardCorrect: boolean;
  orientationCorrect: boolean;
};

export type GuessResult = {
  slotResults: SlotResult[];
  isCorrect: boolean;
};

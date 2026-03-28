import { SavedSetup, GuessSubmission, SlotResult, GuessResult } from '../hooks/GameStateTypes';

/**
 * Compares a guesser's submission against the writer's saved setup.
 *
 * Both savedSetup.cards[i].topWordIndex and submission.slotTopWordIndices[i] are
 * board-relative, so they can be compared directly — board rotation on screen
 * has no effect on the result.
 */
export function checkGuess(savedSetup: SavedSetup, submission: GuessSubmission): GuessResult {
  const slotResults: SlotResult[] = savedSetup.cards.map((savedCard, i) => {
    const cardCorrect = submission.slotCardIds[i] === savedCard.id;

    const guessedTopWordIndex = submission.slotTopWordIndices[i];
    const orientationCorrect =
      guessedTopWordIndex !== null &&
      guessedTopWordIndex !== undefined &&
      guessedTopWordIndex === savedCard.topWordIndex;

    return { cardCorrect, orientationCorrect };
  });

  const isCorrect = slotResults.every((r) => r.cardCorrect && r.orientationCorrect);
  return { slotResults, isCorrect };
}

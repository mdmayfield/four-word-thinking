import { SavedSetup, GuessSubmission, SlotResult, GuessResult } from '../hooks/GameStateTypes';

/**
 * Converts a board-relative topWordIndex to a screen-relative index given
 * the number of 90° CW rotation steps applied to the board.
 */
function toScreenIndex(boardRelIndex: number, steps: number): number {
  return ((boardRelIndex - steps) % 4 + 4) % 4;
}

/**
 * Compares a guesser's submission against the writer's saved setup.
 *
 * A slot is fully correct when:
 * - The same card (by id) is placed in that slot
 * - The card's visually-shown top word matches (same screen-relative orientation)
 */
export function checkGuess(savedSetup: SavedSetup, submission: GuessSubmission): GuessResult {
  const writerSteps = savedSetup.boardRotation / 90;
  const guesserSteps = submission.boardRotation / 90;

  const slotResults: SlotResult[] = savedSetup.cards.map((savedCard, i) => {
    const cardCorrect = submission.slotCardIds[i] === savedCard.id;

    const guessedTopWordIndex = submission.slotTopWordIndices[i];
    let orientationCorrect = false;
    if (guessedTopWordIndex !== null && guessedTopWordIndex !== undefined) {
      const writerScreenIdx = toScreenIndex(savedCard.topWordIndex, writerSteps);
      const guesserScreenIdx = toScreenIndex(guessedTopWordIndex, guesserSteps);
      orientationCorrect = writerScreenIdx === guesserScreenIdx;
    }

    return { cardCorrect, orientationCorrect };
  });

  const isCorrect = slotResults.every((r) => r.cardCorrect && r.orientationCorrect);
  return { slotResults, isCorrect };
}

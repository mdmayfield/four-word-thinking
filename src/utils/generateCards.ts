type FourWords = readonly [string, string, string, string];

export interface CardSet {
  cardWords: readonly [FourWords, FourWords, FourWords, FourWords];
  decoyWords: FourWords;
}

/**
 * Parses a raw word bank string (one word per line) into a deduplicated array.
 * Words are trimmed; empty lines are discarded. Entries are normalized to
 * first-letter-capitalized words (e.g. "wind" -> "Wind"). Duplicates are
 * detected case-insensitively.
 */
export function parseWordBank(raw: string): string[] {
  const toFirstLetterCapital = (value: string): string =>
    value.toLowerCase().replace(/^[a-z]/, (char) => char.toUpperCase());

  const seen = new Set<string>();
  return raw
    .split('\n')
    .map((line) => toFirstLetterCapital(line.trim()))
    .filter((word) => {
      if (!word) return false;
      const key = word.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Randomly draws 20 unique words from the word bank and distributes them into
 * 5 cards of 4 words each. The first 4 cards are the board cards; the 5th is
 * the decoy. All 20 words are guaranteed unique within a single call.
 *
 * Throws if the bank contains fewer than 20 words.
 */
export function generateCardSet(wordBank: string[]): CardSet {
  if (wordBank.length < 20) {
    throw new Error(
      `Word bank must contain at least 20 unique words (found ${wordBank.length}). ` +
        'Add more words to src/data/wordBank.txt.'
    );
  }

  // Fisher-Yates shuffle of a copy, then take the first 20
  const pool = [...wordBank];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const slice = pool.slice(0, 20);
  const groups = Array.from(
    { length: 5 },
    (_, g) => slice.slice(g * 4, g * 4 + 4) as unknown as FourWords
  );

  return {
    cardWords: [groups[0], groups[1], groups[2], groups[3]],
    decoyWords: groups[4],
  };
}

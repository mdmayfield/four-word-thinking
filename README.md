# Four-Word Thinking

A two-player word-puzzle game inspired by [So Clover!](https://www.rprod.com/en/games/so-clover). One player sets up a secret arrangement of word cards; the other tries to reconstruct it exactly.

## How to Play

### The Setup

Each card has **four words**, one on each edge (top, right, bottom, left). The **Writer** places four cards on a 2×2 board, rotates them to their liking, and writes a one-word **clue** for each shared edge between adjacent cards — four clues total reflecting the four pairs of touching words. The Writer then clicks **Save Clues** to lock in the puzzle.

### The Guess

The **Guesser** sees the four clues and five cards (the original four plus one decoy), all shuffled and randomly oriented. Using the clues as hints, the Guesser drags cards onto the board, rotates them into position, and clicks **Submit Guess** when all four slots are filled.

Cards placed in the correct slot *and* correct orientation stay on the board. Everything else is ejected for another try.

### Winning

Get all four cards in the right spots with the right orientation!

## Running Locally

```bash
npm install
npm run dev
```

## Dev Commands

```bash
npm run dev      # start dev server
npm run build    # type-check + build
npm run lint     # ESLint
```

## Tech Stack

- React 19, TypeScript, Vite
- Mantine v8 (UI components)
- CSS Modules

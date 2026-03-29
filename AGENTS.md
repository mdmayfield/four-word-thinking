# Four-Word March — Agent Reference

## What this app is

A two-player word-puzzle game. One player (the **Writer**) arranges four word cards on a 2×2 board and locks in a setup. The other player (the **Guesser**) reconstructs the exact arrangement.

## Core concept

Each card has **four words**, one per edge (top/right/bottom/left). The card can be rotated so any word faces up. The board itself can also be rotated 90°/180°/270°. There is always exactly **five cards** in guessing mode: four real cards and one **decoy** (`id: 'decoy'`). The guesser must place the right four cards in the right slots with the right orientation, and leave the decoy off the board.

## Card orientation model

`topWordIndex` (0–3) tracks which word is visually at the top. While a card is **on the board**, `topWordIndex` is stored in **board-relative** coordinates. While **off the board**, it is **screen-relative**. Conversion happens on drop (off→board: `(idx + steps) % 4`) and on eject (board→off: `((idx - steps) % 4 + 4) % 4`), where `steps = boardRotation / 90`.

Guess checking compares board-relative `topWordIndex` directly — no coordinate conversion needed.

## Modes

| Mode | What happens |
|---|---|
| `'writing'` | Writer places cards in slots (no drag, fixed order), sets four edge labels, rotates cards, optionally rotates board. Clicks **Save Clues**. |
| `'guessing'` | All five cards are shuffled off-board with random orientations. Guesser drags cards onto slots, rotates them, then clicks **Submit Guess** (enabled only when all four slots are filled). |

## State

```
GameStateContext (useState, no reducer)
  savedSetup: SavedSetup | null       ← writer's answer key
  guessSubmission: GuessSubmission | null  ← guesser's latest submission
```

```ts
SavedSetup {
  edges: [string, string, string, string]  // top/right/bottom/left clue labels
  cards: CardState[]   // cards[i] belongs in slot i; topWordIndex is board-relative
  boardRotation: number  // 0 | 90 | 180 | 270
}

GuessSubmission {
  slotCardIds: (string | null)[]
  slotTopWordIndices: (number | null)[]  // board-relative, one per slot
  offboardCardIds: string[]
  edges: [string, string, string, string]
  boardRotation: number
}

GuessResult {
  slotResults: SlotResult[]  // one per slot: { cardCorrect, orientationCorrect }
  isCorrect: boolean
}
```

## Guess checking flow (`guessingSubmit` in `useGameBoard.ts`)

1. Build `GuessSubmission` (captures board-relative `topWordIndex` of each placed card).
2. Call `checkGuess(savedSetup, submission)` → `GuessResult`.
3. Cards in slots where **both** `cardCorrect` and `orientationCorrect` are true **stay on the board**.
4. All other slot cards are ejected: orientation randomized, placed off-board via `placeEjectedCards()`.

## Key files

| File | Purpose |
|---|---|
| `src/hooks/GameStateTypes.ts` | All shared types (`CardState`, `SavedSetup`, `GuessSubmission`, `GuessResult`, `SlotResult`) |
| `src/hooks/GameStateContext.tsx` | Context provider; holds `savedSetup` and `guessSubmission` |
| `src/utils/checkGuess.ts` | Pure guess-checking logic |
| `src/components/Board/useGameBoard.ts` | All game state and actions (single source of truth for the board) |
| `src/components/Board/useGuessingSetup.ts` | Initialises guessing mode (clears slots, scatters all five cards off-board) |
| `src/components/Board/useWindowDropHandlers.ts` | Handles cards dropped outside a slot (onto the window) |
| `src/components/gameBoardUtils.ts` | `shuffleArray`, `getShuffledOffboardPositions`, `placeEjectedCards`, `getSlotFromPoint` |
| `src/components/GameBoard.tsx` | Top-level component; composes the board and controls |
| `src/components/Board/` | `Board`, `BoardGrid`, `WritingBoard`, `GuessingBoard` render components |
| `src/components/GameBoard/` | `ActionControls`, `RotationControls`, `ModeToggle`, `GuessResultDisplay`, `DebugCardList` |

## Tech stack

- React 19, TypeScript, Vite
- Mantine v8 (UI components)
- CSS Modules for component styles
- No external state library — plain `useState` + context

## Dev commands

```bash
npm run dev      # start dev server
npm run build    # type-check + build
npm run lint     # ESLint
```

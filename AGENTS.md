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
| `src/components/GameBoard.tsx` | Top-level component; composes the board, controls, and mobile touch drag |
| `src/components/Board/` | `Board`, `BoardGrid`, `WritingBoard`, `GuessingBoard` render components |
| `src/components/GameBoard/` | `ActionControls`, `RotationControls`, `ModeToggle`, `GuessResultDisplay`, `DebugCardList` |
| `src/hooks/useBoardScale.ts` | Calculates `boardScale` and `isMobile` based on viewport size |

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

---

## Mobile support

### Board scaling (`useBoardScale.ts`)

The board is internally 900×900 CSS pixels. On narrow screens it is scaled down to fit using a CSS `transform: scale(boardScale)` applied to the board wrapper.

```ts
// src/hooks/useBoardScale.ts
const BASE_BOARD_SIZE = 900;   // design-time board size in px
const HORIZONTAL_PADDING = 24; // total left+right breathing room
const RESERVED_HEIGHT = 240;   // px reserved for tray + controls

const getBoardScale = () => {
  const viewport = getViewportSize(); // uses visualViewport API if available
  const usableWidth  = Math.max(320, viewport.width  - HORIZONTAL_PADDING);
  const usableHeight = Math.max(320, viewport.height - RESERVED_HEIGHT);
  return Math.min(1, usableWidth / BASE_BOARD_SIZE, usableHeight / BASE_BOARD_SIZE);
};
```

`isMobile` is `true` whenever `boardScale < 1`. Components use this flag to switch between desktop and mobile layouts/behaviours. The hook listens to both `window.resize` and `window.visualViewport.resize` so it reacts correctly when the on-screen keyboard appears.

### Off-board card tray (mobile)

On desktop, off-board cards float at absolute positions overlapping the board. On mobile (`isMobile === true`), `OffboardCards` switches to a **horizontal scrolling tray** rendered below the board. Each card shell is sized to `320 * boardScale` px so cards appear at the same visual size as they do on the (scaled) board. Cards are `draggable={false}` on mobile; touch interaction is handled entirely by the custom drag system described below.

### Mobile action buttons

In guessing mode, the **Submit Guess** and **Give Up** buttons are rendered **above** the board on mobile so they are never obscured by the card tray at the bottom of the screen.

### Touch drag system (`GameBoard.tsx`)

HTML5 drag-and-drop does not work reliably on mobile browsers. The app uses a fully custom long-press touch drag instead.

#### Key constants and types

```ts
const TOUCH_HOLD_DELAY = 300;      // ms hold before drag starts
const TOUCH_CANCEL_DISTANCE = 12;  // px movement that cancels the pending hold
const BASE_CARD_SIZE = 320;        // card size before scaling

interface ActiveTouchDrag {
  cardId: string;
  source: 'board' | 'offboard';
  touchId: number;    // which Touch identifier we are tracking
  clientX: number;    // current finger position
  clientY: number;
}

interface PendingTouchDrag extends ActiveTouchDrag {
  startX: number;  // finger position at touchstart (for cancel-distance check)
  startY: number;
}
```

#### Lifecycle

1. **`touchstart` on a card** → `handleCardTouchStart()` is called. Stores a `PendingTouchDrag` in `pendingTouchDragRef` and starts a `TOUCH_HOLD_DELAY` timeout.
2. **`touchmove` (pending phase)** — if the finger moves more than `TOUCH_CANCEL_DISTANCE` px before the timeout fires, the pending drag is cancelled (allowing normal page scroll, etc.).
3. **Timeout fires** → promotes `PendingTouchDrag` to `ActiveTouchDrag` via `setActiveTouchDrag`. The source card dims (`opacity: 0.35`) and a floating preview card appears.
4. **`touchmove` (active phase)** — updates `activeTouchDrag.clientX/Y`; the floating preview follows the finger. `event.preventDefault()` is called to suppress scroll/zoom.
5. **`touchend`** → `finishTouchDrag()`:
   - Calls `getSlotFromPoint(clientX, clientY, boardRect, displayRotation)` to determine the target slot.
   - If a slot is found → `moveCardToSlot(cardId, targetSlot, dropPos)`.
   - If no slot and the card came from the board → `moveCardOffBoard(cardId, dropPos)`.
   - Otherwise the card stays where it was.
6. **`touchcancel`** → same as touchend but `isCanceled = true`; no slot placement is attempted.

The three window-level listeners (`touchmove`, `touchend`, `touchcancel`) are registered only when `isMobile && mode === 'guessing'` and are cleaned up whenever either condition changes.

#### Floating drag preview

While `activeTouchDrag` is set, `GameBoard` renders a `<WordCard>` clone outside the normal component tree:

```tsx
<div style={{
  position: 'fixed',
  left: activeTouchDrag.clientX - (BASE_CARD_SIZE * boardScale) / 2,
  top:  activeTouchDrag.clientY - (BASE_CARD_SIZE * boardScale) / 2,
  width: BASE_CARD_SIZE * boardScale,
  height: BASE_CARD_SIZE * boardScale,
  pointerEvents: 'none',
  zIndex: 2000,
}}>
  <WordCard ... />
</div>
```

The preview is centred on the finger and scaled to match the rest of the UI.

#### Imperative card-placement methods (`useGameBoard.ts`)

`moveCardToSlot(cardId, targetSlot, dropPos)` and `moveCardOffBoard(cardId, dropPos)` are the shared primitives used by both the HTML5 drop path (desktop) and the touch drag path (mobile). `handleDropOnSlot` delegates to `moveCardToSlot` internally.

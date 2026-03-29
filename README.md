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

## Deploying to GitHub Pages (No GitHub Actions)

This repository is configured for branch-based static hosting so deployment uses no GitHub Actions runner time.

### One-time setup

1. Push this repository to GitHub.
2. In GitHub, open **Settings > Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Choose branch **main** and folder **/docs**.

### Run a deployment

1. Run `npm run build:pages` locally.
2. Commit and push the generated `docs/` directory.
3. GitHub Pages will serve the latest committed static files.

### Base path note

The app uses `/four-word-thinking/` as the production base path by default (configured in [`vite.config.ts`](vite.config.ts)).
If your repository name is different, set `VITE_BASE_PATH` before building, for example:

```bash
VITE_BASE_PATH=/my-repo/ npm run build:pages
```

## Optional: Google AdSense Banner

A small banner slot is wired into guessing mode and is disabled by default.

1. Add these variables to a local `.env.production` file (do not commit secrets you do not want public):

```bash
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_SLOT=1234567890
```

2. Build and deploy with `npm run build:pages`.
3. Submit your site in AdSense and wait for approval before expecting live ads.

Implementation location:

- Script loader: [`src/App.tsx`](src/App.tsx)
- Banner slot: [`src/components/common/AdBanner.tsx`](src/components/common/AdBanner.tsx)
- Banner placement in game UI: [`src/components/GameBoard.tsx`](src/components/GameBoard.tsx)

## Tech Stack

- React 19, TypeScript, Vite
- Mantine v8 (UI components)
- CSS Modules

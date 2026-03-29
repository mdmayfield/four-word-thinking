import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { CardState, SavedSetup } from '../hooks/GameStateTypes';

type FourWords = readonly [string, string, string, string];

type SharedCardV1 = {
  i: string;
  w: FourWords;
  s: number | null;
  t: number;
};

type SharedPuzzleV1 = {
  v: 1;
  e: FourWords;
  r: number;
  c: SharedCardV1[];
};

export interface DecodedSharedPuzzle {
  savedSetup: SavedSetup;
  decoyState: CardState;
}

export type SharedPuzzleDecodeResult =
  | { status: 'none' }
  | { status: 'invalid' }
  | { status: 'ok'; puzzle: DecodedSharedPuzzle };

const SHARE_PARAM_KEY = 'p';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isFourWords = (value: unknown): value is FourWords => {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((entry) => typeof entry === 'string')
  );
};

const isTopWordIndex = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;
};

const isBoardRotation = (value: unknown): value is number => {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    [0, 90, 180, 270].includes(value)
  );
};

const parseSharedPuzzlePayload = (value: unknown): DecodedSharedPuzzle | null => {
  if (!isObjectRecord(value) || value.v !== 1) return null;
  if (!isFourWords(value.e) || !isBoardRotation(value.r) || !Array.isArray(value.c)) return null;

  const cards = value.c;
  if (cards.length !== 5) return null;

  const seenIds = new Set<string>();
  const seenSlots = new Set<number>();
  const realCardsBySlot: Array<CardState | null> = [null, null, null, null];
  let decoyCard: CardState | null = null;

  for (const entry of cards) {
    if (!isObjectRecord(entry)) return null;
    if (typeof entry.i !== 'string' || !isFourWords(entry.w) || !isTopWordIndex(entry.t)) return null;

    if (seenIds.has(entry.i)) return null;
    seenIds.add(entry.i);

    const cardState: CardState = {
      id: entry.i,
      words: entry.w,
      topWordIndex: entry.t,
    };

    if (entry.s === null) {
      if (entry.i !== 'decoy' || decoyCard !== null) return null;
      decoyCard = cardState;
      continue;
    }

    if (
      typeof entry.s !== 'number' ||
      !Number.isInteger(entry.s) ||
      entry.s < 0 ||
      entry.s > 3 ||
      seenSlots.has(entry.s)
    ) {
      return null;
    }

    seenSlots.add(entry.s);
    realCardsBySlot[entry.s] = cardState;
  }

  if (!decoyCard || realCardsBySlot.some((card) => card === null)) return null;

  return {
    savedSetup: {
      edges: value.e,
      cards: realCardsBySlot.filter((card): card is CardState => card !== null),
      boardRotation: value.r,
    },
    decoyState: decoyCard,
  };
};

const getSharePayloadFromSetup = (
  savedSetup: SavedSetup,
  decoyState: Pick<CardState, 'id' | 'words' | 'topWordIndex'>
): SharedPuzzleV1 => {
  const solutionCards: SharedCardV1[] = savedSetup.cards.map((card, slotIndex) => ({
    i: card.id,
    w: card.words,
    s: slotIndex,
    t: card.topWordIndex,
  }));

  return {
    v: 1,
    e: savedSetup.edges,
    r: savedSetup.boardRotation,
    c: [
      ...solutionCards,
      {
        i: decoyState.id,
        w: decoyState.words,
        s: null,
        t: decoyState.topWordIndex,
      },
    ],
  };
};

export const buildShareUrl = (
  savedSetup: SavedSetup,
  decoyState: Pick<CardState, 'id' | 'words' | 'topWordIndex'>,
  baseHref = window.location.href
): string => {
  const payload = getSharePayloadFromSetup(savedSetup, decoyState);
  const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
  const url = new URL(baseHref);
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  hashParams.set(SHARE_PARAM_KEY, encoded);
  url.hash = hashParams.toString();
  return url.toString();
};

export const decodeSharedPuzzleFromUrl = (urlLike = window.location.href): DecodedSharedPuzzle | null => {
  let url: URL;
  try {
    url = new URL(urlLike, window.location.origin);
  } catch {
    return null;
  }

  const searchParams = url.searchParams;
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  const encoded = hashParams.get(SHARE_PARAM_KEY) ?? searchParams.get(SHARE_PARAM_KEY);

  if (!encoded) return null;

  const decompressed = decompressFromEncodedURIComponent(encoded);
  if (!decompressed) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decompressed);
  } catch {
    return null;
  }

  return parseSharedPuzzlePayload(parsed);
};

export const decodeSharedPuzzleFromUrlDetailed = (
  urlLike = window.location.href
): SharedPuzzleDecodeResult => {
  let url: URL;
  try {
    url = new URL(urlLike, window.location.origin);
  } catch {
    return { status: 'invalid' };
  }

  const searchParams = url.searchParams;
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  const encoded = hashParams.get(SHARE_PARAM_KEY) ?? searchParams.get(SHARE_PARAM_KEY);

  if (!encoded) return { status: 'none' };

  const puzzle = decodeSharedPuzzleFromUrl(url.toString());
  if (!puzzle) return { status: 'invalid' };

  return { status: 'ok', puzzle };
};

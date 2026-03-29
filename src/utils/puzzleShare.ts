import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { CardState, SavedSetup } from '../hooks/GameStateTypes';

type FourWords = readonly [string, string, string, string];

const SHARE_FORMAT_VERSION = 2;
const SHARE_WORD_COUNT = 24;
const TEXT_MODE_RAW = 0;
const TEXT_MODE_DICTIONARY = 1;

type TransportMode = 'b' | 'z';

const toRotationSteps = (boardRotation: number): number | null => {
  if (!Number.isInteger(boardRotation)) return null;
  const normalized = ((boardRotation % 360) + 360) % 360;
  if (normalized % 90 !== 0) return null;
  return normalized / 90;
};

const fromRotationSteps = (rotationSteps: number): number | null => {
  if (!Number.isInteger(rotationSteps) || rotationSteps < 0 || rotationSteps > 3) return null;
  return rotationSteps * 90;
};

const isTopWordIndex = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;
};

const encodeVarUint = (value: number): number[] => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Invalid unsigned varint value');
  }

  const bytes: number[] = [];
  let working = value;
  do {
    const chunk = working & 0x7f;
    working >>>= 7;
    bytes.push(working > 0 ? chunk | 0x80 : chunk);
  } while (working > 0);

  return bytes;
};

const decodeVarUint = (
  bytes: Uint8Array,
  initialOffset: number
): { value: number; nextOffset: number } | null => {
  let offset = initialOffset;
  let shift = 0;
  let value = 0;

  while (offset < bytes.length && shift <= 28) {
    const byte = bytes[offset];
    value |= (byte & 0x7f) << shift;
    offset += 1;

    if ((byte & 0x80) === 0) {
      return { value, nextOffset: offset };
    }

    shift += 7;
  }

  return null;
};

const packTopWordIndices = (cards: CardState[]): number => {
  if (cards.length !== 4) {
    throw new Error('Expected exactly 4 cards in saved setup');
  }

  let packed = 0;
  cards.forEach((card, slotIndex) => {
    if (!isTopWordIndex(card.topWordIndex)) {
      throw new Error('Invalid topWordIndex in saved setup');
    }
    packed |= (card.topWordIndex & 0x03) << (slotIndex * 2);
  });
  return packed;
};

const unpackTopWordIndices = (packed: number): [number, number, number, number] => {
  return [
    packed & 0x03,
    (packed >> 2) & 0x03,
    (packed >> 4) & 0x03,
    (packed >> 6) & 0x03,
  ];
};

const getOrderedWords = (
  savedSetup: SavedSetup,
  decoyState: Pick<CardState, 'words'>
): string[] => {
  const words: string[] = [];
  for (const card of savedSetup.cards) {
    words.push(...card.words);
  }
  words.push(...decoyState.words);
  words.push(...savedSetup.edges);
  return words;
};

const encodeRawWordSection = (words: readonly string[]): Uint8Array => {
  const encoder = new TextEncoder();
  const out: number[] = [];

  for (const word of words) {
    const wordBytes = encoder.encode(word);
    out.push(...encodeVarUint(wordBytes.length), ...wordBytes);
  }

  return Uint8Array.from(out);
};

const encodeDictionaryWordSection = (words: readonly string[]): Uint8Array => {
  const encoder = new TextEncoder();
  const dictionary: string[] = [];
  const dictIndexByWord = new Map<string, number>();
  const wordIndices: number[] = [];

  for (const word of words) {
    const existingIndex = dictIndexByWord.get(word);
    if (existingIndex !== undefined) {
      wordIndices.push(existingIndex);
      continue;
    }

    const index = dictionary.length;
    dictionary.push(word);
    dictIndexByWord.set(word, index);
    wordIndices.push(index);
  }

  const indexWidth = dictionary.length <= 0xff ? 1 : 2;
  const out: number[] = [];
  out.push(...encodeVarUint(dictionary.length));

  for (const entry of dictionary) {
    const bytes = encoder.encode(entry);
    out.push(...encodeVarUint(bytes.length), ...bytes);
  }

  for (const index of wordIndices) {
    if (indexWidth === 1) {
      out.push(index);
    } else {
      out.push(index & 0xff, (index >> 8) & 0xff);
    }
  }

  return Uint8Array.from(out);
};

const decodeRawWordSection = (
  bytes: Uint8Array,
  initialOffset: number,
  count: number
): { words: string[]; nextOffset: number } | null => {
  const decoder = new TextDecoder();
  const words: string[] = [];
  let offset = initialOffset;

  for (let i = 0; i < count; i += 1) {
    const decodedLen = decodeVarUint(bytes, offset);
    if (!decodedLen) return null;
    const { value: length, nextOffset } = decodedLen;
    offset = nextOffset;

    if (length < 0 || offset + length > bytes.length) return null;
    const slice = bytes.slice(offset, offset + length);
    words.push(decoder.decode(slice));
    offset += length;
  }

  return { words, nextOffset: offset };
};

const decodeDictionaryWordSection = (
  bytes: Uint8Array,
  initialOffset: number,
  count: number
): { words: string[]; nextOffset: number } | null => {
  const decoder = new TextDecoder();
  let offset = initialOffset;
  const decodedCount = decodeVarUint(bytes, offset);
  if (!decodedCount) return null;
  const dictCount = decodedCount.value;
  offset = decodedCount.nextOffset;

  if (dictCount <= 0) return null;

  const dictionary: string[] = [];
  for (let i = 0; i < dictCount; i += 1) {
    const decodedLen = decodeVarUint(bytes, offset);
    if (!decodedLen) return null;
    const { value: length, nextOffset } = decodedLen;
    offset = nextOffset;

    if (length < 0 || offset + length > bytes.length) return null;
    dictionary.push(decoder.decode(bytes.slice(offset, offset + length)));
    offset += length;
  }

  const indexWidth = dictCount <= 0xff ? 1 : 2;
  if (offset + count * indexWidth > bytes.length) return null;

  const words: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const index =
      indexWidth === 1
        ? bytes[offset + i]
        : bytes[offset + i * 2] | (bytes[offset + i * 2 + 1] << 8);

    if (index < 0 || index >= dictionary.length) return null;
    words.push(dictionary[index]);
  }

  return { words, nextOffset: offset + count * indexWidth };
};

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromBase64Url = (value: string): Uint8Array | null => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return null;
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const bytesToLatin1 = (bytes: Uint8Array): string => {
  let value = '';
  for (let i = 0; i < bytes.length; i += 1) {
    value += String.fromCharCode(bytes[i]);
  }
  return value;
};

const latin1ToBytes = (value: string): Uint8Array => {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) {
    bytes[i] = value.charCodeAt(i) & 0xff;
  }
  return bytes;
};

const encodePuzzleBytes = (
  savedSetup: SavedSetup,
  decoyState: Pick<CardState, 'words'>
): Uint8Array => {
  if (savedSetup.cards.length !== 4) {
    throw new Error('Expected exactly 4 cards in saved setup');
  }
  if (savedSetup.edges.length !== 4 || decoyState.words.length !== 4) {
    throw new Error('Expected 4-word tuples for edges and decoy');
  }

  const rotationSteps = toRotationSteps(savedSetup.boardRotation);
  if (rotationSteps === null) {
    throw new Error('Invalid board rotation');
  }

  const packedTopWordIndices = packTopWordIndices(savedSetup.cards);
  const orderedWords = getOrderedWords(savedSetup, decoyState);

  if (orderedWords.length !== SHARE_WORD_COUNT) {
    throw new Error('Unexpected share word payload length');
  }

  const rawSection = encodeRawWordSection(orderedWords);
  const dictionarySection = encodeDictionaryWordSection(orderedWords);
  const textMode = dictionarySection.length < rawSection.length ? TEXT_MODE_DICTIONARY : TEXT_MODE_RAW;
  const textSection = textMode === TEXT_MODE_DICTIONARY ? dictionarySection : rawSection;

  const header = ((SHARE_FORMAT_VERSION & 0x0f) << 4) | ((rotationSteps & 0x03) << 2) | (textMode & 0x03);
  const out = new Uint8Array(2 + textSection.length);
  out[0] = header;
  out[1] = packedTopWordIndices;
  out.set(textSection, 2);
  return out;
};

const decodePuzzleBytes = (bytes: Uint8Array): DecodedSharedPuzzle | null => {
  if (bytes.length < 2) return null;

  const header = bytes[0];
  const version = (header >> 4) & 0x0f;
  if (version !== SHARE_FORMAT_VERSION) return null;

  const rotationSteps = (header >> 2) & 0x03;
  const textMode = header & 0x03;
  const boardRotation = fromRotationSteps(rotationSteps);
  if (boardRotation === null) return null;

  const topWordIndices = unpackTopWordIndices(bytes[1]);

  let decodedWords: { words: string[]; nextOffset: number } | null = null;
  if (textMode === TEXT_MODE_RAW) {
    decodedWords = decodeRawWordSection(bytes, 2, SHARE_WORD_COUNT);
  } else if (textMode === TEXT_MODE_DICTIONARY) {
    decodedWords = decodeDictionaryWordSection(bytes, 2, SHARE_WORD_COUNT);
  } else {
    return null;
  }

  if (!decodedWords || decodedWords.nextOffset !== bytes.length) return null;

  const words = decodedWords.words;
  const cardWordSlices: FourWords[] = [
    [words[0], words[1], words[2], words[3]],
    [words[4], words[5], words[6], words[7]],
    [words[8], words[9], words[10], words[11]],
    [words[12], words[13], words[14], words[15]],
  ];

  const decoyWords: FourWords = [words[16], words[17], words[18], words[19]];
  const edges: FourWords = [words[20], words[21], words[22], words[23]];

  const cards: CardState[] = cardWordSlices.map((cardWords, slotIndex) => ({
    id: `card-${slotIndex}`,
    words: cardWords,
    topWordIndex: topWordIndices[slotIndex],
  }));

  return {
    savedSetup: {
      edges,
      cards,
      boardRotation,
    },
    decoyState: {
      id: 'decoy',
      words: decoyWords,
      topWordIndex: 0,
    },
  };
};

const encodeTransport = (bytes: Uint8Array): string => {
  const base64Payload = toBase64Url(bytes);
  const compressedPayload = compressToEncodedURIComponent(bytesToLatin1(bytes));

  const direct = (`b${base64Payload}`) as const;
  const compressed = (`z${compressedPayload}`) as const;

  return compressed.length < direct.length ? compressed : direct;
};

const decodeTransport = (payload: string): Uint8Array | null => {
  if (payload.length < 2) return null;
  const mode = payload[0] as TransportMode;
  const value = payload.slice(1);

  if (mode === 'b') {
    return fromBase64Url(value);
  }

  if (mode === 'z') {
    const decompressed = decompressFromEncodedURIComponent(value);
    if (decompressed === null) return null;
    return latin1ToBytes(decompressed);
  }

  return null;
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

export const stripSharedPuzzleParamsFromUrl = (urlLike = window.location.href): string => {
  let url: URL;
  try {
    url = new URL(urlLike, window.location.origin);
  } catch {
    return window.location.href;
  }

  url.searchParams.delete(SHARE_PARAM_KEY);

  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  hashParams.delete(SHARE_PARAM_KEY);
  const nextHash = hashParams.toString();
  url.hash = nextHash ? nextHash : '';

  return url.toString();
};

export const buildShareUrl = (
  savedSetup: SavedSetup,
  decoyState: Pick<CardState, 'id' | 'words' | 'topWordIndex'>,
  baseHref = window.location.href
): string => {
  const payloadBytes = encodePuzzleBytes(savedSetup, decoyState);
  const encoded = encodeTransport(payloadBytes);
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

  const payloadBytes = decodeTransport(encoded);
  if (!payloadBytes) return null;

  return decodePuzzleBytes(payloadBytes);
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

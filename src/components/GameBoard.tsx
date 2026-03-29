import React, { useEffect, useRef, useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import Board from './Board/Board';
import { useGameBoard } from './Board/useGameBoard';
import ModeToggle from './GameBoard/ModeToggle';
import RotationControls from './GameBoard/RotationControls';
import { PrimaryActionButton, GiveUpButton, ShareActions } from './GameBoard/ActionControls';
import DebugCardList from './GameBoard/DebugCardList';
import GuessResultDisplay from './GameBoard/GuessResultDisplay';
import OffboardCards from './OffboardCards';
import WordCard from './WordCard';
import AdBanner from './common/AdBanner';
import { useGameState } from '../hooks/GameStateContext';
import { checkGuess } from '../utils/checkGuess';
import { stripSharedPuzzleParamsFromUrl } from '../utils/puzzleShare';
import { useBoardScale } from '../hooks/useBoardScale';
import { getSlotFromPoint } from './gameBoardUtils';
import styles from './GameBoard.module.css';

const DEBUG = false; // import.meta.env.DEV;
const TOUCH_HOLD_DELAY = 300;
const TOUCH_CANCEL_DISTANCE = 12;
const BASE_CARD_SIZE = 320;

interface GameBoardProps {
  wordBank: string[];
  initialEdges?: readonly [string, string, string, string];
}

type TouchDragSource = 'board' | 'offboard';

interface ActiveTouchDrag {
  cardId: string;
  source: TouchDragSource;
  touchId: number;
  clientX: number;
  clientY: number;
}

interface PendingTouchDrag extends ActiveTouchDrag {
  startX: number;
  startY: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  wordBank,
  initialEdges = ['', '', '', ''] as const,
}) => {
  const { savedSetup, guessSubmission } = useGameState();
  const guessResult =
    savedSetup && guessSubmission ? checkGuess(savedSetup, guessSubmission) : null;
  const { boardScale, isMobile } = useBoardScale();

  const {
    mode,
    setMode,
    boardRef,
    gridRef,
    boardRect,
    displayRotation,
    boardRotation,
    disableTransition,
    setDisableTransition,
    edges,
    setEdges,
    cards,
    slotCardIds,
    offboardCardIds,
    offboardCardPositions,
    topOffboardCardId,
    decoyState,
    guessingSubmitEnabled,
    primeLookup,
    rotateBoard,
    rotateBoardTo,
    setCardTopWord,
    moveCardToSlot,
    moveCardOffBoard,
    correctSlots,
    handleDropOnSlot,
    handleDragStart,
    writingSubmit,
    guessingSubmit,
    nextRound,
    selectedCardId,
    deselectCard,
    handleCardClick,
    handleSlotClick,
    draggingCardId,
    clearDragState,
    shareUrl,
    hasInvalidSharedPuzzle,
    reshuffleOffboardCards,
  } = useGameBoard(wordBank, initialEdges, isMobile);

  const EDGE_TARGET_ROTATIONS = [0, 270, 180, 90] as const;
  const [focusEdgeIndex, setFocusEdgeIndex] = useState<number | null>(null);
  const [focusRequestId, setFocusRequestId] = useState(0);
  const touchHoldTimeoutRef = useRef<number | null>(null);
  const pendingTouchDragRef = useRef<PendingTouchDrag | null>(null);
  const [activeTouchDrag, setActiveTouchDrag] = useState<ActiveTouchDrag | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [invalidLinkModalOpen, setInvalidLinkModalOpen] = useState(hasInvalidSharedPuzzle);
  const [copyLabel, setCopyLabel] = useState('Copy Link');
  const [qrSize, setQrSize] = useState(280);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const pendingDesktopReshuffleRef = useRef(false);

  // Escape key to deselect
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') deselectCard();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deselectCard]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isShareModalOpen) return;

    const setResponsiveQrSize = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const nextSize = Math.floor(Math.max(220, Math.min(460, Math.min(width, height) - 64)));
      setQrSize(nextSize);
    };

    setResponsiveQrSize();
    window.addEventListener('resize', setResponsiveQrSize);
    window.visualViewport?.addEventListener('resize', setResponsiveQrSize);

    return () => {
      window.removeEventListener('resize', setResponsiveQrSize);
      window.visualViewport?.removeEventListener('resize', setResponsiveQrSize);
    };
  }, [isShareModalOpen]);

  // dragend fires when a drag is cancelled (Escape, drop outside window, etc.)
  useEffect(() => {
    window.addEventListener('dragend', clearDragState);
    return () => window.removeEventListener('dragend', clearDragState);
  }, [clearDragState]);

  // When switching from mobile to desktop, reshuffle any off-board cards into desktop positions
  const prevIsMobileRef = useRef(isMobile);
  useEffect(() => {
    if (prevIsMobileRef.current && !isMobile) {
      pendingDesktopReshuffleRef.current = true;
    }
    prevIsMobileRef.current = isMobile;
  }, [isMobile]);

  useEffect(() => {
    if (!pendingDesktopReshuffleRef.current) return;
    if (isMobile || mode !== 'guessing' || !boardRect) return;

    const timeoutId = window.setTimeout(() => {
      const didReshuffle = reshuffleOffboardCards();
      if (didReshuffle) {
        pendingDesktopReshuffleRef.current = false;
      }
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [isMobile, mode, boardRect, reshuffleOffboardCards]);

  useEffect(() => {
    if (isMobile || mode !== 'guessing' || offboardCardIds.length === 0 || !boardRect) return;

    const hasMobileOriginPositions = offboardCardIds.some((id) => {
      const pos = offboardCardPositions[id];
      return !pos || (pos.x === 0 && pos.y === 0);
    });

    if (hasMobileOriginPositions) {
      reshuffleOffboardCards();
    }
  }, [isMobile, mode, offboardCardIds, offboardCardPositions, boardRect, reshuffleOffboardCards]);

  const requestEdgeFocus = (edgeIndex: number) => {
    setFocusEdgeIndex(edgeIndex);
    setFocusRequestId((prev) => prev + 1);
  };

  const handleEdgeFocus = (edgeIndex: number) => {
    rotateBoardTo(EDGE_TARGET_ROTATIONS[edgeIndex]);
  };

  const handleRotateBoard = (direction: 'left' | 'right') => {
    rotateBoard(direction);
    if (mode === 'writing') {
      const delta = direction === 'right' ? 90 : -90;
      const newBoardRotation = (boardRotation + delta + 360) % 360;
      requestEdgeFocus((4 - newBoardRotation / 90) % 4);
    }
  };

  useEffect(() => {
    if (correctSlots.length === 4) {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 } });
    }
  }, [correctSlots.length]);

  useEffect(() => {
    if (mode === 'writing') {
      requestEdgeFocus(0);
    }
  }, [mode]);

  useEffect(() => {
    if (!isMobile || mode !== 'guessing') {
      if (touchHoldTimeoutRef.current !== null) {
        window.clearTimeout(touchHoldTimeoutRef.current);
        touchHoldTimeoutRef.current = null;
      }
      pendingTouchDragRef.current = null;
      setActiveTouchDrag(null);
      return;
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (activeTouchDrag) {
        const activeTouch = Array.from(event.touches).find(
          (touch) => touch.identifier === activeTouchDrag.touchId
        );
        if (!activeTouch) return;

        event.preventDefault();
        setActiveTouchDrag((prev) =>
          prev
            ? {
                ...prev,
                clientX: activeTouch.clientX,
                clientY: activeTouch.clientY,
              }
            : prev
        );
        return;
      }

      const pending = pendingTouchDragRef.current;
      if (!pending) return;

      const touch = Array.from(event.touches).find((item) => item.identifier === pending.touchId);
      if (!touch) return;

      const distance = Math.hypot(touch.clientX - pending.startX, touch.clientY - pending.startY);
      if (distance > TOUCH_CANCEL_DISTANCE) {
        if (touchHoldTimeoutRef.current !== null) {
          window.clearTimeout(touchHoldTimeoutRef.current);
          touchHoldTimeoutRef.current = null;
        }
        pendingTouchDragRef.current = null;
      }
    };

    const clearTouchDrag = () => {
      if (touchHoldTimeoutRef.current !== null) {
        window.clearTimeout(touchHoldTimeoutRef.current);
        touchHoldTimeoutRef.current = null;
      }
      pendingTouchDragRef.current = null;
      setActiveTouchDrag(null);
    };

    const finishTouchDrag = (changedTouches: TouchList, isCanceled: boolean) => {
      const completedDrag = activeTouchDrag;
      if (completedDrag) {
        const changedTouch = Array.from(changedTouches).find(
          (touch) => touch.identifier === completedDrag.touchId
        );
        if (changedTouch) {
          const dropPos = { x: changedTouch.clientX, y: changedTouch.clientY };
          const targetSlot = getSlotFromPoint(
            dropPos.x,
            dropPos.y,
            boardRect,
            displayRotation
          );

          if (!isCanceled && targetSlot !== null) {
            moveCardToSlot(completedDrag.cardId, targetSlot, dropPos);
          } else if (completedDrag.source === 'board') {
            moveCardOffBoard(completedDrag.cardId, dropPos);
          }
        }
      }

      clearTouchDrag();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const pending = pendingTouchDragRef.current;
      if (pending) {
        const changedTouch = Array.from(event.changedTouches).find(
          (touch) => touch.identifier === pending.touchId
        );
        if (changedTouch) {
          event.preventDefault();
          // Short tap — treat as click/select
          handleCardClick(pending.cardId, pending.source, {
            x: changedTouch.clientX,
            y: changedTouch.clientY,
          });
          clearTouchDrag();
          return;
        }
      }

      if (activeTouchDrag) {
        event.preventDefault();
      }
      finishTouchDrag(event.changedTouches, false);
    };

    const handleTouchCancel = (event: TouchEvent) => {
      finishTouchDrag(event.changedTouches, true);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [activeTouchDrag, boardRect, displayRotation, handleCardClick, isMobile, mode, moveCardOffBoard, moveCardToSlot]);

  const handleCardTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
    cardId: string,
    source: TouchDragSource
  ) => {
    if (!isMobile || mode !== 'guessing') return;
    if (event.target instanceof Element && event.target.closest('button')) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    if (touchHoldTimeoutRef.current !== null) {
      window.clearTimeout(touchHoldTimeoutRef.current);
    }

    const pendingTouch: PendingTouchDrag = {
      cardId,
      source,
      touchId: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
      startX: touch.clientX,
      startY: touch.clientY,
    };

    pendingTouchDragRef.current = pendingTouch;
    touchHoldTimeoutRef.current = window.setTimeout(() => {
      setActiveTouchDrag({
        cardId: pendingTouch.cardId,
        source: pendingTouch.source,
        touchId: pendingTouch.touchId,
        clientX: pendingTouch.clientX,
        clientY: pendingTouch.clientY,
      });
      pendingTouchDragRef.current = null;
      touchHoldTimeoutRef.current = null;
    }, TOUCH_HOLD_DELAY);
  };

  const trayPadding = isMobile && mode === 'guessing' ? Math.ceil(320 * boardScale) + 32 : 24;
  const activeTouchCard = activeTouchDrag
    ? activeTouchDrag.cardId === decoyState.id
      ? decoyState
      : primeLookup[activeTouchDrag.cardId] ?? null
    : null;
  const touchPreviewRotation = activeTouchDrag?.source === 'board' ? boardRotation : 0;
  const activeDnDCardId = draggingCardId ?? activeTouchDrag?.cardId ?? null;

  // Background click: deselect or eject selected board card to click position
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('button')) return;
    if (!selectedCardId) return;
    const isOnBoard = slotCardIds.some((id) => id === selectedCardId);
    if (isOnBoard) {
      moveCardOffBoard(selectedCardId, { x: e.clientX, y: e.clientY });
    }
    deselectCard();
  };

  // Offboard tray/table background click
  const handleOffboardAreaClick = (pos: { x: number; y: number }) => {
    if (!selectedCardId) return;
    const isOnBoard = slotCardIds.some((id) => id === selectedCardId);
    if (isOnBoard) {
      moveCardOffBoard(selectedCardId, pos);
    }
    deselectCard();
  };

  const resetCopyLabelSoon = () => {
    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current);
    }
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setCopyLabel('Copy Link');
      copyResetTimeoutRef.current = null;
    }, 1400);
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!success) throw new Error('Copy command failed');
      }

      setCopyLabel('Copied');
      resetCopyLabelSoon();
    } catch {
      setCopyLabel('Copy Failed');
      resetCopyLabelSoon();
    }
  };

  const clearSharedPuzzleUrlParams = () => {
    const cleanUrl = stripSharedPuzzleParamsFromUrl();
    window.history.replaceState(null, '', cleanUrl);
  };

  return (
    <>
      <Modal
        opened={invalidLinkModalOpen}
        onClose={() => {
          setInvalidLinkModalOpen(false);
          clearSharedPuzzleUrlParams();
        }}
        title="Invalid puzzle link"
        size="sm"
        yOffset="12vh"
        styles={{
          inner: { paddingLeft: 16, paddingRight: 16 },
          body: { paddingBottom: 'max(var(--mantine-spacing-xl), env(safe-area-inset-bottom))' },
        }}
      >
        <Stack gap="md">
          <Text>Could not open the shared puzzle. Please try with a different link, or start a new puzzle.</Text>
          <Button
            fullWidth
            onClick={() => {
              setInvalidLinkModalOpen(false);
              clearSharedPuzzleUrlParams();
            }}
          >
            OK
          </Button>
        </Stack>
      </Modal>

      <Stack
        align="center"
        gap="xl"
        style={{
          minHeight: '100dvh',
          cursor: selectedCardId ? 'crosshair' : undefined,
          justifyContent: isMobile ? 'flex-start' : 'center',
          padding: `16px 16px ${trayPadding}px`,
          width: '100%',
          boxSizing: 'border-box',
        }}
        onClick={handleBackgroundClick}
      >
      {DEBUG && <ModeToggle mode={mode} setMode={setMode} />}

      <RotationControls
        boardRotation={boardRotation}
        rotateBoard={handleRotateBoard}
        showLabel={DEBUG}
        boardScale={boardScale}
        centerContent={
          <PrimaryActionButton
            mode={mode}
            onWritingSubmit={writingSubmit}
            writingSubmitEnabled={edges.every((e) => e.trim().length > 0)}
            onGuessingSubmit={guessingSubmit}
            guessingSubmitEnabled={guessingSubmitEnabled}
            isWon={correctSlots.length === 4}
            onNextRound={nextRound}
            onGiveUp={nextRound}
            giveUpEnabled={false}
          />
        }
      />

      <div
        className={styles.scaleFrame}
        style={{ width: 760 * boardScale, height: 760 * boardScale }}
      >
        <div
          className={styles.viewportWrapper}
          style={{ transform: `scale(${boardScale})`, transformOrigin: 'top left' }}
        >
          <Board
            mode={mode}
            boardRef={boardRef}
            gridRef={gridRef}
            boardRect={boardRect}
            displayRotation={displayRotation}
            boardRotation={boardRotation}
            disableTransition={disableTransition}
            setDisableTransition={setDisableTransition}
            edges={edges}
            setEdges={setEdges}
            onEdgeFocus={handleEdgeFocus}
            focusEdgeIndex={focusEdgeIndex}
            focusRequestId={focusRequestId}
            cards={cards}
            slotCardIds={slotCardIds}
            primeLookup={primeLookup}
            decoyState={decoyState}
            setCardTopWord={setCardTopWord}
            handleDropOnSlot={handleDropOnSlot}
            handleDragStart={handleDragStart}
            onCardTouchStart={handleCardTouchStart}
            isMobile={isMobile}
            activeTouchCardId={activeTouchDrag?.cardId ?? null}
            correctSlots={correctSlots}
            selectedCardId={selectedCardId}
            handleCardClick={handleCardClick}
            handleSlotClick={handleSlotClick}
            draggingCardId={activeDnDCardId}
          />
        </div>
      </div>

      {mode === 'guessing' && (
        <OffboardCards
          offboardCardIds={offboardCardIds}
          primeLookup={primeLookup}
          decoyState={decoyState}
          offboardCardPositions={offboardCardPositions}
          topOffboardCardId={topOffboardCardId}
          setCardTopWord={setCardTopWord}
          onDragStart={handleDragStart}
                    selectedCardId={selectedCardId}
                    handleCardClick={handleCardClick}
                    onBackgroundClick={handleOffboardAreaClick}
          onCardTouchStart={handleCardTouchStart}
          boardScale={boardScale}
          isMobile={isMobile}
          activeTouchCardId={activeTouchDrag?.cardId ?? null}
          selectedCardIsOnBoard={selectedCardId !== null && slotCardIds.some((id) => id === selectedCardId)}
        />
      )}

      {mode === 'guessing' && <AdBanner />}

      {activeTouchCard && activeTouchDrag && (
        <div
          style={{
            position: 'fixed',
            left: activeTouchDrag.clientX - (BASE_CARD_SIZE * boardScale) / 2,
            top: activeTouchDrag.clientY - (BASE_CARD_SIZE * boardScale) / 2,
            width: BASE_CARD_SIZE * boardScale,
            height: BASE_CARD_SIZE * boardScale,
            pointerEvents: 'none',
            zIndex: 2000,
            opacity: 0.95,
          }}
        >
          <div
            style={{
              width: BASE_CARD_SIZE,
              height: BASE_CARD_SIZE,
              transform: `scale(${boardScale})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              style={{
                width: BASE_CARD_SIZE,
                height: BASE_CARD_SIZE,
                transform: `rotate(${touchPreviewRotation}deg)`,
                transformOrigin: 'center',
              }}
            >
              <WordCard
                id={activeTouchDrag.cardId}
                words={activeTouchCard.words}
                boardRotation={activeTouchDrag.source === 'board' ? displayRotation : 0}
                topWordIndex={activeTouchCard.topWordIndex}
                isRotationEnabled={false}
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'guessing' && correctSlots.length < 4 && !slotCardIds.every((id) => id !== null) && (
        <Group gap="xs" justify="center" wrap="wrap">
          <GiveUpButton
            onGiveUp={nextRound}
            giveUpEnabled={mode === 'guessing' && correctSlots.length < 4 && slotCardIds.some((id) => id === null)}
          />
          <ShareActions
            onOpenQr={() => setIsShareModalOpen(true)}
            onCopyLink={handleCopyLink}
            shareEnabled={Boolean(shareUrl)}
            copyLabel={copyLabel}
          />
        </Group>
      )}

      <Modal
        opened={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fullScreen
        title="Scan To Play"
      >
        <Stack align="center" justify="center" style={{ minHeight: '75dvh', width: '100%' }}>
          {shareUrl ? (
            <QRCodeSVG value={shareUrl} size={qrSize} />
          ) : (
            <Text c="dimmed">No shareable puzzle link is available yet.</Text>
          )}
          <Group gap="xs">
            <Button variant="default" onClick={handleCopyLink} disabled={!shareUrl}>
              {copyLabel}
            </Button>
            <Button onClick={() => setIsShareModalOpen(false)}>Close</Button>
          </Group>
          {shareUrl && (
            <Text size="sm" c="dimmed" ta="center" maw={680}>
              Open this link or scan the QR code on another device to start guessing this board.
            </Text>
          )}
        </Stack>
      </Modal>

      <DebugCardList mode={mode} cards={cards} decoyState={decoyState} show={DEBUG} />

      {guessResult && <GuessResultDisplay result={guessResult} show={DEBUG} />}
    </Stack>
    </>
  );
};

export default GameBoard;
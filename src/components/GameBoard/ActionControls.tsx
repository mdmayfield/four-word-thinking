import React from 'react';
import { Button, Group } from '@mantine/core';
import { Mode } from '../Board/types';

interface ActionControlsProps {
  mode: Mode;
  onWritingSubmit: () => void;
  writingSubmitEnabled: boolean;
  onGuessingSubmit: () => void;
  guessingSubmitEnabled: boolean;
  isWon: boolean;
  onNextRound: () => void;
  onGiveUp: () => void;
  giveUpEnabled: boolean;
}

/** The primary action button (Save Clues / Submit Guess / Next Round). */
export const PrimaryActionButton: React.FC<ActionControlsProps> = ({
  mode,
  onWritingSubmit,
  writingSubmitEnabled,
  onGuessingSubmit,
  guessingSubmitEnabled,
  isWon,
  onNextRound,
}) => {
  if (mode === 'writing') {
    return (
      <Button onClick={onWritingSubmit} size="sm" disabled={!writingSubmitEnabled}>
        Save Clues
      </Button>
    );
  }
  if (isWon) {
    return (
      <Button onClick={onNextRound} size="sm" color="green">
        Next Round
      </Button>
    );
  }
  return (
    <Button onClick={onGuessingSubmit} size="sm" disabled={!guessingSubmitEnabled}>
      Submit Guess
    </Button>
  );
};

/** Give Up button — shown separately below the board. */
export const GiveUpButton: React.FC<Pick<ActionControlsProps, 'onGiveUp' | 'giveUpEnabled'>> = ({
  onGiveUp,
  giveUpEnabled,
}) => (
  <Button onClick={onGiveUp} size="sm" color="red" disabled={!giveUpEnabled}>
    Give Up
  </Button>
);

interface ShareActionsProps {
  onOpenQr: () => void;
  onCopyLink: () => void;
  shareEnabled: boolean;
  copyLabel?: string;
}

export const ShareActions: React.FC<ShareActionsProps> = ({
  onOpenQr,
  onCopyLink,
  shareEnabled,
  copyLabel = 'Copy Link',
}) => {
  return (
    <Group gap="xs">
      <Button size="sm" variant="default" onClick={onOpenQr} disabled={!shareEnabled}>
        QR Code
      </Button>
      <Button size="sm" variant="default" onClick={onCopyLink} disabled={!shareEnabled}>
        {copyLabel}
      </Button>
    </Group>
  );
};

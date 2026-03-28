import React from 'react';
import { CardState } from '../../hooks/GameStateTypes';
import { Mode } from '../Board/types';

interface DebugCardListProps {
  mode: Mode;
  cards: CardState[];
  decoyState: CardState;
  show?: boolean;
}

const DebugCardList: React.FC<DebugCardListProps> = ({ mode, cards, decoyState, show = false }) => {
  if (!show) return null;

  const listWords = (card: CardState) => (
    <ul style={{ margin: 0, paddingLeft: '1rem', textAlign: 'left' }}>
      {card.words.map((word, i) => (
        <li key={`${card.id}-${i}`} style={{ margin: '0 0 .2rem 0', textAlign: 'left' }}>
          <span style={{ fontWeight: i === card.topWordIndex ? 'bold' : 'normal' }}>{word}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        width: '220px',
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto',
        padding: '0.7rem',
        background: 'rgba(0, 0, 0, 0.75)',
        color: '#fff',
        borderRadius: '10px',
        fontSize: '12px',
        zIndex: 9999,
      }}
    >
      <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>DEBUG: Card words</div>
      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>On-board cards</div>
        {cards.map((card) => (
          <div key={card.id} style={{ marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{card.id}</div>
            {listWords(card)}
          </div>
        ))}
      </div>
      {mode === 'guessing' && (
        <div>
          <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Decoy card</div>
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{decoyState.id}</div>
            {listWords(decoyState)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugCardList;

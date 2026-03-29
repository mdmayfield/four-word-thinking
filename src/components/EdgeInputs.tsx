import React from 'react';
import { Mode } from './Board/types';
import styles from './EdgeInputs.module.css';

type EdgeTuple = readonly [string, string, string, string];

interface EdgeInputsProps {
  edges: EdgeTuple;
  setEdges: React.Dispatch<React.SetStateAction<EdgeTuple>>;
  mode: Mode;
  onEdgeFocus?: (edgeIndex: number) => void;
}

const EdgeInputs: React.FC<EdgeInputsProps> = ({ edges, setEdges, mode, onEdgeFocus }) => {
  const [top, right, bottom, left] = edges;

  return (
    <>
      <input
        className={styles.inputStyle}
        style={{
          top: '-2rem',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        value={top}
        onChange={(e) => setEdges([e.target.value, right, bottom, left] as const)}
        onFocus={() => onEdgeFocus?.(0)}
        aria-label="Top edge label"
        disabled={mode === 'guessing'}
      />
      <input
        className={styles.inputStyle}
        style={{
          top: '50%',
          right: '-2rem',
          transform: 'translate(50%, -50%) rotate(90deg)',
        }}
        value={right}
        onChange={(e) => setEdges([top, e.target.value, bottom, left] as const)}
        onFocus={() => onEdgeFocus?.(1)}
        aria-label="Right edge label"
        disabled={mode === 'guessing'}
      />
      <input
        className={styles.inputStyle}
        style={{
          bottom: '-2rem',
          left: '50%',
          transform: 'translate(-50%, 50%) rotate(180deg)',
        }}
        value={bottom}
        onChange={(e) => setEdges([top, right, e.target.value, left] as const)}
        onFocus={() => onEdgeFocus?.(2)}
        aria-label="Bottom edge label"
        disabled={mode === 'guessing'}
      />
      <input
        className={styles.inputStyle}
        style={{
          top: '50%',
          left: '-2rem',
          transform: 'translate(-50%, -50%) rotate(270deg)',
        }}
        value={left}
        onChange={(e) => setEdges([top, right, bottom, e.target.value] as const)}
        onFocus={() => onEdgeFocus?.(3)}
        aria-label="Left edge label"
        disabled={mode === 'guessing'}
      />
    </>
  );
};

export default EdgeInputs;

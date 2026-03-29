import React, { useEffect, useRef } from 'react';
import { Mode } from './Board/types';
import styles from './EdgeInputs.module.css';

type EdgeTuple = readonly [string, string, string, string];

interface EdgeInputsProps {
  edges: EdgeTuple;
  setEdges: React.Dispatch<React.SetStateAction<EdgeTuple>>;
  mode: Mode;
  onEdgeFocus?: (edgeIndex: number) => void;
  onCompleteEnter?: () => void;
  focusEdgeIndex?: number | null;
  focusRequestId?: number;
}

const EdgeInputs: React.FC<EdgeInputsProps> = ({
  edges,
  setEdges,
  mode,
  onEdgeFocus,
  onCompleteEnter,
  focusEdgeIndex,
  focusRequestId,
}) => {
  const [top, right, bottom, left] = edges;
  const inputValues = [top, right, bottom, left];
  const inputRefs = useRef([
    React.createRef<HTMLInputElement>(),
    React.createRef<HTMLInputElement>(),
    React.createRef<HTMLInputElement>(),
    React.createRef<HTMLInputElement>(),
  ]).current;

  const handleBlur = (index: number) => {
    const trimmed = inputValues[index].trim();
    if (trimmed !== inputValues[index]) {
      const next = [top, right, bottom, left] as [string, string, string, string];
      next[index] = trimmed;
      setEdges(next as readonly [string, string, string, string]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (inputValues.every((value) => value.trim().length > 0) && onCompleteEnter) {
        onCompleteEnter();
        return;
      }

      inputRefs[(index + 1) % 4].current?.focus();
    }
  };

  useEffect(() => {
    if (focusEdgeIndex != null) {
      inputRefs[focusEdgeIndex].current?.focus();
    }
  }, [focusEdgeIndex, focusRequestId, inputRefs]);

  return (
    <>
      <input
        ref={inputRefs[0]}
        className={styles.inputStyle}
        style={{
          top: '-2rem',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        value={top}
        onChange={(e) => setEdges([e.target.value, right, bottom, left] as const)}
        onFocus={() => onEdgeFocus?.(0)}
        onBlur={() => handleBlur(0)}
        onKeyDown={(e) => handleKeyDown(e, 0)}
        aria-label="Top edge label"
        disabled={mode === 'guessing'}
      />
      <input
        ref={inputRefs[1]}
        className={styles.inputStyle}
        style={{
          top: '50%',
          right: '-2rem',
          transform: 'translate(50%, -50%) rotate(90deg)',
        }}
        value={right}
        onChange={(e) => setEdges([top, e.target.value, bottom, left] as const)}
        onFocus={() => onEdgeFocus?.(1)}
        onBlur={() => handleBlur(1)}
        onKeyDown={(e) => handleKeyDown(e, 1)}
        aria-label="Right edge label"
        disabled={mode === 'guessing'}
      />
      <input
        ref={inputRefs[2]}
        className={styles.inputStyle}
        style={{
          bottom: '-2rem',
          left: '50%',
          transform: 'translate(-50%, 50%) rotate(180deg)',
        }}
        value={bottom}
        onChange={(e) => setEdges([top, right, e.target.value, left] as const)}
        onFocus={() => onEdgeFocus?.(2)}
        onBlur={() => handleBlur(2)}
        onKeyDown={(e) => handleKeyDown(e, 2)}
        aria-label="Bottom edge label"
        disabled={mode === 'guessing'}
      />
      <input
        ref={inputRefs[3]}
        className={styles.inputStyle}
        style={{
          top: '50%',
          left: '-2rem',
          transform: 'translate(-50%, -50%) rotate(270deg)',
        }}
        value={left}
        onChange={(e) => setEdges([top, right, bottom, e.target.value] as const)}
        onFocus={() => onEdgeFocus?.(3)}
        onBlur={() => handleBlur(3)}
        onKeyDown={(e) => handleKeyDown(e, 3)}
        aria-label="Left edge label"
        disabled={mode === 'guessing'}
      />
    </>
  );
};

export default EdgeInputs;

import React from 'react';
import { Mode } from './gameBoardUtils';

type EdgeTuple = readonly [string, string, string, string];

interface EdgeInputsProps {
  edges: EdgeTuple;
  setEdges: React.Dispatch<React.SetStateAction<EdgeTuple>>;
  mode: Mode;
}

const inputStyle: React.CSSProperties = {
  position: 'absolute',
  width: '420px',
  height: '64px',
  fontSize: '3rem',
  textAlign: 'center',
  zIndex: 10,
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid #ccc',
  borderRadius: '4px',
};

const EdgeInputs: React.FC<EdgeInputsProps> = ({ edges, setEdges, mode }) => {
  const [top, right, bottom, left] = edges;

  return (
    <>
      <input
        style={{
          ...inputStyle,
          top: '-2rem',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        value={top}
        onChange={(e) => setEdges([e.target.value, right, bottom, left] as const)}
        aria-label="Top edge label"
        disabled={mode === 'guessing'}
      />
      <input
        style={{
          ...inputStyle,
          top: '50%',
          right: '-2rem',
          transform: 'translate(50%, -50%) rotate(90deg)',
        }}
        value={right}
        onChange={(e) => setEdges([top, e.target.value, bottom, left] as const)}
        aria-label="Right edge label"
        disabled={mode === 'guessing'}
      />
      <input
        style={{
          ...inputStyle,
          bottom: '-2rem',
          left: '50%',
          transform: 'translate(-50%, 50%) rotate(180deg)',
        }}
        value={bottom}
        onChange={(e) => setEdges([top, right, e.target.value, left] as const)}
        aria-label="Bottom edge label"
        disabled={mode === 'guessing'}
      />
      <input
        style={{
          ...inputStyle,
          top: '50%',
          left: '-2rem',
          transform: 'translate(-50%, -50%) rotate(270deg)',
        }}
        value={left}
        onChange={(e) => setEdges([top, right, bottom, e.target.value] as const)}
        aria-label="Left edge label"
        disabled={mode === 'guessing'}
      />
    </>
  );
};

export default EdgeInputs;

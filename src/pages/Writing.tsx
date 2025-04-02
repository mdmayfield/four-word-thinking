import { useState } from 'react';
import { Board } from '../components/Board/Board';
import { EdgeWords } from '../types/board';

const Writing = () => {
  const [words, setWords] = useState<EdgeWords>({
    top: "Top Word",
    right: "Right Word",
    bottom: "Bottom Word",
    left: "Left Word"
  });

  const handleWordChange = (position: keyof EdgeWords, newValue: string) => {
    setWords(prev => ({
      ...prev,
      [position]: newValue
    }));
  };

  return (
    <div>
      <h1>Writing Phase</h1>
      <Board 
        words={words} 
        isEditable={true}
        onWordChange={handleWordChange}
      />
    </div>
  );
};

export default Writing;

export interface EdgeWords {
    top: string;
    right: string;
    bottom: string;
    left: string;
  }
  
  export interface BoardProps {
    words: EdgeWords;
    isEditable?: boolean;
    onWordChange?: (position: keyof EdgeWords, newValue: string) => void;
  }

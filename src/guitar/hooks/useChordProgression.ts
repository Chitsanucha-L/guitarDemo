import { useState, useCallback, useRef } from "react";

export function useChordProgression(chords: string[]) {
  const [index, setIndex] = useState(0);

  const indexRef = useRef(0);
  const chordsRef = useRef(chords);
  chordsRef.current = chords;

  const advance = useCallback((): string => {
    indexRef.current = (indexRef.current + 1) % chordsRef.current.length;
    setIndex(indexRef.current);
    return chordsRef.current[indexRef.current];
  }, []);

  const reset = useCallback((): string => {
    indexRef.current = 0;
    setIndex(0);
    return chordsRef.current[0];
  }, []);

  return {
    currentChord: chordsRef.current[indexRef.current],
    index,
    advance,
    reset,
  };
}

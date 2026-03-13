import { useState, useEffect, useCallback, useRef } from "react";
import type { ChordData } from "../data/types";
import { GAME_CHORDS } from "../data/chordShapes";

export type GameStatus = "idle" | "playing" | "correct" | "wrong" | "gameover";

export interface PressedPosition {
  string: string; // "E6" | "A" | "D" | "G" | "B" | "e1"
  fret: number;
}

export function useChordGame() {
  const [currentChord, setCurrentChord] = useState<{ name: string; data: ChordData } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pressedPositions, setPressedPositions] = useState<PressedPosition[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameStatus === "playing") {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameStatus("gameover");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStatus]);

  const selectRandomChord = useCallback(() => {
    const pick = GAME_CHORDS[Math.floor(Math.random() * GAME_CHORDS.length)];
    setCurrentChord({ name: pick.name, data: pick.data });
    setPressedPositions([]);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setCorrectCount(0);
    setWrongCount(0);
    setGameStatus("playing");
    selectRandomChord();
  }, [selectRandomChord]);

  const resetGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setCorrectCount(0);
    setWrongCount(0);
    setPressedPositions([]);
    setCurrentChord(null);
    setGameStatus("idle");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  // Toggle press: same string+fret removes it; different fret replaces; new string adds.
  // Only fret > 0 positions are accepted — open strings are automatic.
  const registerPress = useCallback((stringName: string, fret: number) => {
    if (gameStatus !== "playing" || fret <= 0) return;

    setPressedPositions((prev) => {
      const existing = prev.find((p) => p.string === stringName && p.fret === fret);
      if (existing) {
        return prev.filter((p) => !(p.string === stringName && p.fret === fret));
      }
      const filtered = prev.filter((p) => p.string !== stringName);
      return [...filtered, { string: stringName, fret }];
    });
  }, [gameStatus]);

  // Validate pressed positions against target chord.
  //  - fret > 0 : player MUST have pressed exactly that fret
  //  - fret = 0 : open string — player must NOT have pressed anything
  //  - fret < 0 : muted string — player must NOT have pressed anything
  const validateChord = useCallback(() => {
    if (!currentChord || gameStatus !== "playing") return;

    const targetNotes = currentChord.data.notes;
    let isCorrect = true;

    for (const [stringName, noteData] of Object.entries(targetNotes)) {
      const targetFret = noteData.fret;
      const pressed = pressedPositions.find((p) => p.string === stringName);

      if (targetFret > 0) {
        // Fretted — player must have pressed this exact fret
        if (!pressed || pressed.fret !== targetFret) { isCorrect = false; break; }
      } else {
        // Open (0) or muted (-1) — player must NOT have pressed this string
        if (pressed) { isCorrect = false; break; }
      }
    }

    if (isCorrect) {
      setGameStatus("correct");
      setScore((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
      
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setGameStatus("playing");
        selectRandomChord();
      }, 1500);
    } else {
      setGameStatus("wrong");
      setWrongCount((prev) => prev + 1);
      setTimeLeft((prev) => Math.max(0, prev - 2));
      
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setPressedPositions([]);
        setGameStatus("playing");
      }, 1500);
    }
  }, [currentChord, gameStatus, pressedPositions, selectRandomChord]);

  const clearPresses = useCallback(() => {
    setPressedPositions([]);
  }, []);

  return {
    currentChord,
    score,
    timeLeft,
    pressedPositions,
    gameStatus,
    correctCount,
    wrongCount,
    startGame,
    resetGame,
    selectRandomChord,
    registerPress,
    validateChord,
    clearPresses,
  };
}

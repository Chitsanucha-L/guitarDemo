import { useState, useEffect, useCallback, useRef } from "react";
import type { ChordData } from "../data/types";
import { chords, majorChords, minorChords } from "../data/chords";

export type GameStatus = "idle" | "playing" | "correct" | "wrong" | "gameover";

interface PressedPosition {
  string: string; // "E6" | "A" | "D" | "G" | "B" | "e1"
  fret: number;
}

export function useChordGame() {
  const [currentChord, setCurrentChord] = useState<{ name: string; data: ChordData } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pressedPositions, setPressedPositions] = useState<PressedPosition[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  
  const timerRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  // Timer logic
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

  // Select random chord
  const selectRandomChord = useCallback(() => {
    const allChordNames = [...majorChords, ...minorChords];
    const randomName = allChordNames[Math.floor(Math.random() * allChordNames.length)];
    const chordData = chords[randomName];
    setCurrentChord({ name: randomName, data: chordData });
    setPressedPositions([]);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(10000);
    setGameStatus("playing");
    selectRandomChord();
  }, [selectRandomChord]);

  // Reset game
  const resetGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
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

  // Register press (called from guitar interaction)
  const registerPress = useCallback((stringName: string, fret: number) => {
    if (gameStatus !== "playing") return;

    setPressedPositions((prev) => {
      // Remove existing press on this string
      const filtered = prev.filter((p) => p.string !== stringName);
      // Add new press
      return [...filtered, { string: stringName, fret }];
    });
  }, [gameStatus]);

  // Validate chord
  const validateChord = useCallback(() => {
    if (!currentChord || gameStatus !== "playing") return;

    const targetNotes = currentChord.data.notes;
    
    // Check if all required positions are pressed
    let isCorrect = true;
    const requiredStrings = Object.keys(targetNotes);

    // Check each required string
    for (const stringName of requiredStrings) {
      const targetFret = targetNotes[stringName as keyof typeof targetNotes].fret;
      const pressed = pressedPositions.find((p) => p.string === stringName);

      if (!pressed || pressed.fret !== targetFret) {
        isCorrect = false;
        break;
      }
    }

    // Check for extra presses (wrong strings)
    const extraPresses = pressedPositions.filter(
      (p) => !requiredStrings.includes(p.string)
    );
    if (extraPresses.length > 0) {
      isCorrect = false;
    }

    // Apply result
    if (isCorrect) {
      setGameStatus("correct");
      setScore((prev) => prev + 1);
      
      // Clear feedback timeout if exists
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      // Next chord after 1 second
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setGameStatus("playing");
        selectRandomChord();
      }, 1000);
    } else {
      setGameStatus("wrong");
      setTimeLeft((prev) => Math.max(0, prev - 2)); // Reduce 2 seconds
      
      // Clear feedback timeout if exists
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      // Clear pressed positions and continue after 1 second
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setPressedPositions([]);
        setGameStatus("playing");
      }, 1000);
    }
  }, [currentChord, gameStatus, pressedPositions, selectRandomChord]);

  // Clear pressed positions (for manual reset)
  const clearPresses = useCallback(() => {
    setPressedPositions([]);
  }, []);

  return {
    currentChord,
    score,
    timeLeft,
    pressedPositions,
    gameStatus,
    startGame,
    resetGame,
    selectRandomChord,
    registerPress,
    validateChord,
    clearPresses,
  };
}

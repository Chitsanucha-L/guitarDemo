import { useState, useEffect, useCallback, useRef } from "react";
import type { ChordData } from "../data/types";
import { GAME_CHORDS } from "../data/chordShapes";

export type GameStatus = "idle" | "playing" | "correct" | "wrong" | "gameover";
export type GameMode = "practice" | "challenge";

export interface PressedPosition {
  string: string;
  fret: number;
}

export interface FeedbackMarker {
  string: string;
  fret: number;
  type: "correct" | "wrong";
}

export interface PressedBarre {
  fret: number;
  strings: string[];
}

export function useChordGame() {
  const [currentChord, setCurrentChord] = useState<{ name: string; data: ChordData } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pressedPositions, setPressedPositions] = useState<PressedPosition[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>("practice");
  const [feedbackMarkers, setFeedbackMarkers] = useState<FeedbackMarker[]>([]);
  const [missingCount, setMissingCount] = useState(0);
  const [pressedBarre, setPressedBarre] = useState<PressedBarre | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameStatus === "playing" && gameMode === "challenge") {
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
  }, [gameStatus, gameMode]);

  const selectRandomChord = useCallback(() => {
    const pick = GAME_CHORDS[Math.floor(Math.random() * GAME_CHORDS.length)];
    setCurrentChord({ name: pick.name, data: pick.data });
    setPressedPositions([]);
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre(null);
  }, []);

  const startGame = useCallback((mode: GameMode) => {
    setGameMode(mode);
    setScore(0);
    setTimeLeft(30);
    setCorrectCount(0);
    setWrongCount(0);
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre(null);
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
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre(null);
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

  const registerPress = useCallback((stringName: string, fret: number) => {
    if (gameStatus !== "playing" || fret <= 0) return;

    setFeedbackMarkers([]);
    setMissingCount(0);

    // If this tap is on a string that was part of the barre, remove the barre
    setPressedBarre((prev) => {
      if (prev && prev.fret === fret && prev.strings.includes(stringName)) {
        return null;
      }
      return prev;
    });

    setPressedPositions((prev) => {
      const existing = prev.find((p) => p.string === stringName && p.fret === fret);
      if (existing) {
        return prev.filter((p) => !(p.string === stringName && p.fret === fret));
      }
      const filtered = prev.filter((p) => p.string !== stringName);
      return [...filtered, { string: stringName, fret }];
    });
  }, [gameStatus]);

  const registerBarre = useCallback((strings: string[], fret: number) => {
    if (gameStatus !== "playing" || fret <= 0) return;

    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre({ fret, strings });

    setPressedPositions((prev) => {
      let next = prev.filter((p) => !strings.includes(p.string));
      for (const s of strings) {
        next = [...next, { string: s, fret }];
      }
      return next;
    });
  }, [gameStatus]);

  const buildFeedback = useCallback((): { isCorrect: boolean; markers: FeedbackMarker[]; missing: number } => {
    if (!currentChord) return { isCorrect: true, markers: [], missing: 0 };

    const targetNotes = currentChord.data.notes;
    const markers: FeedbackMarker[] = [];
    let isCorrect = true;
    let missing = 0;

    for (const [stringName, noteData] of Object.entries(targetNotes)) {
      const targetFret = noteData.fret;
      const pressed = pressedPositions.find((p) => p.string === stringName);

      if (targetFret > 0) {
        if (pressed && pressed.fret === targetFret) {
          markers.push({ string: stringName, fret: targetFret, type: "correct" });
        } else if (pressed) {
          isCorrect = false;
          markers.push({ string: stringName, fret: pressed.fret, type: "wrong" });
        } else {
          isCorrect = false;
          missing++;
        }
      } else {
        if (pressed) {
          isCorrect = false;
          markers.push({ string: stringName, fret: pressed.fret, type: "wrong" });
        }
      }
    }

    return { isCorrect, markers, missing };
  }, [currentChord, pressedPositions]);

  const validateChord = useCallback(() => {
    if (!currentChord || gameStatus !== "playing") return;

    const { isCorrect, markers, missing } = buildFeedback();

    if (gameMode === "practice") {
      setFeedbackMarkers(markers);
      setMissingCount(missing);

      if (isCorrect) {
        setGameStatus("correct");
        setScore((prev) => prev + 1);
        setCorrectCount((prev) => prev + 1);
      } else {
        setGameStatus("wrong");
        setWrongCount((prev) => prev + 1);
      }
    } else {
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
          setPressedBarre(null);
          setGameStatus("playing");
          selectRandomChord();
        }, 1500);
      }
    }
  }, [currentChord, gameStatus, gameMode, buildFeedback, selectRandomChord]);

  const practiceNext = useCallback(() => {
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre(null);
    setGameStatus("playing");
    selectRandomChord();
  }, [selectRandomChord]);

  const practiceRetry = useCallback(() => {
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedPositions([]);
    setPressedBarre(null);
    setGameStatus("playing");
  }, []);

  const clearPresses = useCallback(() => {
    setPressedPositions([]);
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre(null);
  }, []);

  return {
    currentChord,
    score,
    timeLeft,
    pressedPositions,
    pressedBarre,
    gameStatus,
    correctCount,
    wrongCount,
    gameMode,
    feedbackMarkers,
    missingCount,
    startGame,
    resetGame,
    selectRandomChord,
    registerPress,
    registerBarre,
    validateChord,
    clearPresses,
    practiceNext,
    practiceRetry,
  };
}

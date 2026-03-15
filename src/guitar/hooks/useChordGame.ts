import { useState, useEffect, useCallback, useRef } from "react";
import type { ChordData } from "../data/types";
import {
  getGameChordPool,
  type GameDifficulty,
  type GameChordEntry,
} from "../data/gameDifficulty";
import { getNote } from "../data/constants";
import type { Note } from "../data/types";

export type GameStatus = "idle" | "playing" | "correct" | "wrong" | "gameover" | "won";
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

/** Challenge mode countdown (seconds). */
const CHALLENGE_TIME_SECONDS = 60;

/** String order 6→1 for pitch computation (getNote uses index 0=string6). */
const STRING_ORDER: Note[] = ["E6", "A", "D", "G", "B", "e1"];

/** Get the set of pitch classes (note names) that define this chord — any voicing. */
function getChordPitchClasses(data: ChordData): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < STRING_ORDER.length; i++) {
    const noteKey = STRING_ORDER[i];
    const fret = data.notes[noteKey]?.fret ?? -1;
    if (fret >= 0) set.add(getNote(i, fret));
  }
  return set;
}

/** Get pitch classes the user is playing (each string: pressed fret or 0 = open). */
function getPlayedPitchClasses(pressed: PressedPosition[]): { set: Set<string>; perString: { stringName: string; fret: number; note: string }[] } {
  const perString: { stringName: string; fret: number; note: string }[] = [];
  for (let i = 0; i < STRING_ORDER.length; i++) {
    const stringName = STRING_ORDER[i];
    const fret = pressed.find((p) => p.string === stringName)?.fret ?? 0;
    const note = getNote(i, fret);
    perString.push({ stringName, fret, note });
  }
  const set = new Set(perString.map((s) => s.note));
  return { set, perString };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useChordGame() {
  const [currentChord, setCurrentChord] = useState<{ name: string; data: ChordData } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_TIME_SECONDS);
  const [pressedPositions, setPressedPositions] = useState<PressedPosition[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>("practice");
  const [gameDifficulty, setGameDifficulty] = useState<GameDifficulty>("medium");
  const [feedbackMarkers, setFeedbackMarkers] = useState<FeedbackMarker[]>([]);
  const [missingCount, setMissingCount] = useState(0);
  const [pressedBarre, setPressedBarre] = useState<PressedBarre | null>(null);
  /** Cleared this session (each chord name at most once for win). */
  const [clearedCount, setClearedCount] = useState(0);
  const [poolSize, setPoolSize] = useState(0);

  const timerRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  /** Full chord set for this game only — reset when starting a new game. */
  const fullPoolRef = useRef<GameChordEntry[]>([]);
  const completedNamesRef = useRef<Set<string>>(new Set());
  /**
   * One "cycle" within the same game: each chord at most once, no duplicates.
   * Cycle 1 = full pool (shuffled). When empty, cycle 2+ = only chords not yet
   * answered correctly (wrong / retry), shuffled again — same timer, same game.
   */
  const cycleQueueRef = useRef<GameChordEntry[]>([]);

  const applyChordPick = useCallback((entry: GameChordEntry) => {
    setCurrentChord({ name: entry.name, data: entry.data });
    setPressedPositions([]);
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre(null);
  }, []);

  /** true = win, false = next chord, null = empty pool */
  const pickNextChord = useCallback((): boolean | null => {
    const pool = fullPoolRef.current;
    const completed = completedNamesRef.current;
    if (pool.length === 0) return null;
    if (completed.size >= pool.length) return true;

    if (cycleQueueRef.current.length === 0) {
      const stillNeed = pool.filter((c) => !completed.has(c.name));
      if (stillNeed.length === 0) return true;
      cycleQueueRef.current = shuffle(stillNeed);
    }

    const next = cycleQueueRef.current.shift()!;
    applyChordPick(next);
    return false;
  }, [applyChordPick]);

  const startGame = useCallback(
    (mode: GameMode, difficulty: GameDifficulty) => {
      const pool = getGameChordPool(difficulty);
      fullPoolRef.current = pool;
      completedNamesRef.current = new Set();
      cycleQueueRef.current = shuffle([...pool]);
      setPoolSize(pool.length);
      setClearedCount(0);
      setGameDifficulty(difficulty);
      setGameMode(mode);
      setScore(0);
      setTimeLeft(CHALLENGE_TIME_SECONDS);
      setCorrectCount(0);
      setWrongCount(0);
      setFeedbackMarkers([]);
      setMissingCount(0);
      setPressedBarre(null);

      if (pool.length === 0) {
        setCurrentChord(null);
        setGameStatus("idle");
        return;
      }

      const first = cycleQueueRef.current.shift()!;
      applyChordPick(first);
      setGameStatus("playing");
    },
    [applyChordPick],
  );

  const resetGame = useCallback(() => {
    setScore(0);
    setTimeLeft(CHALLENGE_TIME_SECONDS);
    setCorrectCount(0);
    setWrongCount(0);
    setClearedCount(0);
    setPoolSize(0);
    setPressedPositions([]);
    setCurrentChord(null);
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre(null);
    setGameStatus("idle");
    fullPoolRef.current = [];
    completedNamesRef.current = new Set();
    cycleQueueRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

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

  const registerPress = useCallback((stringName: string, fret: number) => {
    if (gameStatus !== "playing" || fret <= 0) return;

    setFeedbackMarkers([]);
    setMissingCount(0);

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

    const required = getChordPitchClasses(currentChord.data);
    const { set: playedSet, perString } = getPlayedPitchClasses(pressedPositions);

    const markers: FeedbackMarker[] = [];
    for (const { stringName, fret, note } of perString) {
      if (fret <= 0) continue;
      const type = required.has(note) ? "correct" : "wrong";
      markers.push({ string: stringName, fret, type });
    }

    const isCorrect =
      required.size > 0 &&
      required.size === playedSet.size &&
      [...required].every((n) => playedSet.has(n)) &&
      [...playedSet].every((n) => required.has(n));
    const missing = [...required].filter((n) => !playedSet.has(n)).length;

    return { isCorrect, markers, missing };
  }, [currentChord, pressedPositions]);

  const validateChord = useCallback(() => {
    if (!currentChord || gameStatus !== "playing") return;

    const { isCorrect, markers, missing } = buildFeedback();
    const name = currentChord.name;

    if (gameMode === "practice") {
      setFeedbackMarkers(markers);
      setMissingCount(missing);

      if (isCorrect) {
        if (!completedNamesRef.current.has(name)) {
          completedNamesRef.current.add(name);
          setClearedCount(completedNamesRef.current.size);
          setScore((prev) => prev + 1);
        }
        setCorrectCount((prev) => prev + 1);
        const pool = fullPoolRef.current;
        if (completedNamesRef.current.size >= pool.length) {
          setGameStatus("won");
          return;
        }
        setGameStatus("correct");
      } else {
        setGameStatus("wrong");
        setWrongCount((prev) => prev + 1);
      }
    } else {
      if (isCorrect) {
        if (!completedNamesRef.current.has(name)) {
          completedNamesRef.current.add(name);
          setClearedCount(completedNamesRef.current.size);
          setScore((prev) => prev + 1);
        }
        setCorrectCount((prev) => prev + 1);
        const pool = fullPoolRef.current;
        if (completedNamesRef.current.size >= pool.length) {
          setGameStatus("won");
          return;
        }
        setGameStatus("correct");
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = window.setTimeout(() => {
          const win = pickNextChord();
          if (win === true) setGameStatus("won");
          else if (win === false) setGameStatus("playing");
        }, 1500);
      } else {
        setGameStatus("wrong");
        setWrongCount((prev) => prev + 1);
        setTimeLeft((prev) => Math.max(0, prev - 2));

        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = window.setTimeout(() => {
          setPressedPositions([]);
          setPressedBarre(null);
          const win = pickNextChord();
          if (win === true) setGameStatus("won");
          else if (win === false) setGameStatus("playing");
        }, 1500);
      }
    }
  }, [currentChord, gameStatus, gameMode, buildFeedback, pickNextChord]);

  const practiceNext = useCallback(() => {
    const pool = fullPoolRef.current;
    if (completedNamesRef.current.size >= pool.length) {
      setGameStatus("won");
      return;
    }
    setFeedbackMarkers([]);
    setMissingCount(0);
    setPressedBarre(null);
    const win = pickNextChord();
    if (win === true) setGameStatus("won");
    else setGameStatus("playing");
  }, [pickNextChord]);

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
    gameDifficulty,
    feedbackMarkers,
    missingCount,
    clearedCount,
    poolSize,
    startGame,
    resetGame,
    registerPress,
    registerBarre,
    validateChord,
    clearPresses,
    practiceNext,
    practiceRetry,
  };
}

export type { GameDifficulty };

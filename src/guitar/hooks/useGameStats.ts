import { useState, useCallback } from "react";
import type { GameMode } from "./useChordGame";
import type { GameDifficulty } from "./useChordGame";

const STORAGE_KEY = "guitar-game-stats-v3";

export interface ModeStats {
  bestScore: number;
  totalGames: number;
  totalCorrect: number;
  totalWrong: number;
  totalAttempts: number;
}

const DEFAULT_MODE: ModeStats = {
  bestScore: 0,
  totalGames: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalAttempts: 0,
};

const DIFFICULTIES: GameDifficulty[] = ["easy", "medium", "hard", "veryHard"];

function emptyDifficultyRecord(): Record<GameDifficulty, ModeStats> {
  return {
    easy: { ...DEFAULT_MODE },
    medium: { ...DEFAULT_MODE },
    hard: { ...DEFAULT_MODE },
    veryHard: { ...DEFAULT_MODE },
  };
}

export interface AllStats {
  practice: Record<GameDifficulty, ModeStats>;
  challenge: Record<GameDifficulty, ModeStats>;
}

const DEFAULT_ALL: AllStats = {
  practice: emptyDifficultyRecord(),
  challenge: emptyDifficultyRecord(),
};

function loadStats(): AllStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_ALL)) as AllStats;
    const parsed = JSON.parse(raw) as Partial<AllStats>;
    const next: AllStats = {
      practice: emptyDifficultyRecord(),
      challenge: emptyDifficultyRecord(),
    };
    for (const mode of ["practice", "challenge"] as const) {
      const bucket = parsed[mode];
      if (bucket && typeof bucket === "object") {
        for (const d of DIFFICULTIES) {
          if (bucket[d]) {
            next[mode][d] = { ...DEFAULT_MODE, ...bucket[d] };
          }
        }
      }
    }
    return next;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_ALL)) as AllStats;
  }
}

function saveStats(stats: AllStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function useGameStats() {
  const [allStats, setAllStats] = useState<AllStats>(loadStats);

  const recordGame = useCallback(
    (mode: GameMode, difficulty: GameDifficulty, score: number, correct: number, wrong: number) => {
      setAllStats((prev) => {
        const prevMode = prev[mode][difficulty];
        const nextMode: ModeStats = {
          bestScore: Math.max(prevMode.bestScore, score),
          totalGames: prevMode.totalGames + 1,
          totalCorrect: prevMode.totalCorrect + correct,
          totalWrong: prevMode.totalWrong + wrong,
          totalAttempts: prevMode.totalAttempts + correct + wrong,
        };
        const next: AllStats = {
          ...prev,
          [mode]: { ...prev[mode], [difficulty]: nextMode },
        };
        saveStats(next);
        return next;
      });
    },
    [],
  );

  const resetStats = useCallback(() => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_ALL)) as AllStats;
    saveStats(fresh);
    setAllStats(fresh);
  }, []);

  const getAccuracy = useCallback((mode: GameMode, difficulty: GameDifficulty) => {
    const s = allStats[mode][difficulty];
    return s.totalAttempts > 0 ? Math.round((s.totalCorrect / s.totalAttempts) * 100) : 0;
  }, [allStats]);

  return { allStats, recordGame, resetStats, getAccuracy };
}

import { useState, useCallback } from "react";
import type { GameMode } from "./useChordGame";

const STORAGE_KEY = "guitar-game-stats-v2";

export interface ModeStats {
  bestScore: number;
  totalGames: number;
  totalCorrect: number;
  totalWrong: number;
  totalAttempts: number;
}

export interface AllStats {
  practice: ModeStats;
  challenge: ModeStats;
}

const DEFAULT_MODE: ModeStats = {
  bestScore: 0,
  totalGames: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalAttempts: 0,
};

const DEFAULT_ALL: AllStats = {
  practice: { ...DEFAULT_MODE },
  challenge: { ...DEFAULT_MODE },
};

function loadStats(): AllStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { practice: { ...DEFAULT_MODE }, challenge: { ...DEFAULT_MODE } };
    const parsed = JSON.parse(raw);
    return {
      practice: { ...DEFAULT_MODE, ...parsed.practice },
      challenge: { ...DEFAULT_MODE, ...parsed.challenge },
    };
  } catch {
    return { practice: { ...DEFAULT_MODE }, challenge: { ...DEFAULT_MODE } };
  }
}

function saveStats(stats: AllStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function useGameStats() {
  const [allStats, setAllStats] = useState<AllStats>(loadStats);

  const recordGame = useCallback((mode: GameMode, score: number, correct: number, wrong: number) => {
    setAllStats((prev) => {
      const prevMode = prev[mode];
      const nextMode: ModeStats = {
        bestScore: Math.max(prevMode.bestScore, score),
        totalGames: prevMode.totalGames + 1,
        totalCorrect: prevMode.totalCorrect + correct,
        totalWrong: prevMode.totalWrong + wrong,
        totalAttempts: prevMode.totalAttempts + correct + wrong,
      };
      const next: AllStats = { ...prev, [mode]: nextMode };
      saveStats(next);
      return next;
    });
  }, []);

  const resetStats = useCallback(() => {
    const fresh: AllStats = { ...DEFAULT_ALL, practice: { ...DEFAULT_MODE }, challenge: { ...DEFAULT_MODE } };
    saveStats(fresh);
    setAllStats(fresh);
  }, []);

  const getAccuracy = useCallback((mode: GameMode) => {
    const s = allStats[mode];
    return s.totalAttempts > 0 ? Math.round((s.totalCorrect / s.totalAttempts) * 100) : 0;
  }, [allStats]);

  return { allStats, recordGame, resetStats, getAccuracy };
}

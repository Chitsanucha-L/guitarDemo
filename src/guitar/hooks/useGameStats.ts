import { useState, useCallback } from "react";

const STORAGE_KEY = "guitar-game-stats";

export interface GameStats {
  bestScore: number;
  totalGames: number;
  totalCorrect: number;
  totalWrong: number;
  totalAttempts: number;
}

const DEFAULT_STATS: GameStats = {
  bestScore: 0,
  totalGames: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalAttempts: 0,
};

function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function saveStats(stats: GameStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function useGameStats() {
  const [stats, setStats] = useState<GameStats>(loadStats);

  const recordGame = useCallback((score: number, correct: number, wrong: number) => {
    setStats((prev) => {
      const next: GameStats = {
        bestScore: Math.max(prev.bestScore, score),
        totalGames: prev.totalGames + 1,
        totalCorrect: prev.totalCorrect + correct,
        totalWrong: prev.totalWrong + wrong,
        totalAttempts: prev.totalAttempts + correct + wrong,
      };
      saveStats(next);
      return next;
    });
  }, []);

  const resetStats = useCallback(() => {
    const fresh = { ...DEFAULT_STATS };
    saveStats(fresh);
    setStats(fresh);
  }, []);

  const accuracy = stats.totalAttempts > 0
    ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
    : 0;

  return { stats, accuracy, recordGame, resetStats };
}

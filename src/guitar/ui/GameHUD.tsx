import { useTranslation } from "react-i18next";
import type { GameMode } from "../hooks/useChordGame";

interface GameHUDProps {
  chordName: string | null;
  score: number;
  timeLeft: number;
  showTimer?: boolean;
  gameMode?: GameMode;
  difficultyLabel?: string;
  /** Unique chords cleared this game / pool size */
  clearedCount?: number;
  poolSize?: number;
  onQuit?: () => void;
}

export default function GameHUD({
  chordName,
  score,
  timeLeft,
  showTimer = true,
  gameMode = "challenge",
  difficultyLabel,
  clearedCount = 0,
  poolSize = 0,
  onQuit,
}: GameHUDProps) {
  const { t } = useTranslation();
  const timeColor =
    timeLeft <= 10 ? "text-red-500" : timeLeft <= 20 ? "text-yellow-500" : "text-green-500";
  const isPractice = gameMode === "practice";

  return (
    <div className="absolute top-0 left-0 w-full min-h-[8rem] pointer-events-none z-50">
      {/* Score — Top Left */}
      <div className="absolute top-1 lg:top-20 left-3 lg:left-6">
        <div className="bg-gray-900/60 backdrop-blur-md rounded-xl px-3 lg:px-5 py-1.5 lg:py-3 border border-blue-500/30 shadow-lg shadow-blue-500/5">
          <div className="text-[9px] lg:text-xs text-gray-500 font-medium uppercase tracking-wider">{t("game.score")}</div>
          <div className="text-lg lg:text-4xl font-bold text-white tabular-nums">{score}</div>
          {poolSize > 0 && (
            <div className="text-[9px] lg:text-xs text-cyan-400/90 mt-0.5 tabular-nums">
              {clearedCount}/{poolSize} {t("game.chordsCleared")}
            </div>
          )}
        </div>
      </div>

      {/* Chord Name — Top Center */}
      <div className="absolute top-1 lg:top-16 left-1/2 transform -translate-x-1/2">
        <div className="relative">
          <div className="absolute -inset-1 bg-yellow-500/20 rounded-2xl blur-lg" />
          <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl px-3 lg:px-14 py-1.5 lg:py-5 border-2 border-yellow-500/40 shadow-md lg:shadow-2xl shadow-yellow-500/10">
            <div className="text-[7px] lg:text-xs text-gray-500 font-medium text-center uppercase tracking-widest mb-0 lg:mb-1">{t("game.playThisChord")}</div>
            <div className="text-xl lg:text-4xl xl:text-6xl font-black text-yellow-400 tracking-wider drop-shadow-lg text-center">
              {chordName || "---"}
            </div>
            <div className="flex justify-center flex-wrap gap-1 mt-0.5 lg:mt-2">
              <span
                className={`text-[7px] lg:text-[9px] xl:text-[11px] font-bold px-2 lg:px-2.5 xl:px-3 py-0.5 lg:py-1 rounded-full ${
                  isPractice
                    ? "bg-purple-600/60 text-purple-200 border border-purple-400/30"
                    : "bg-orange-600/60 text-orange-200 border border-orange-400/30"
                }`}
              >
                {isPractice ? t("mode.practice") : t("mode.challenge")}
              </span>
              {difficultyLabel && (
                <span className="text-[7px] lg:text-[9px] xl:text-[11px] font-bold px-2 lg:px-2.5 xl:px-3 py-0.5 lg:py-1 rounded-full bg-cyan-600/50 text-cyan-100 border border-cyan-400/30">
                  {difficultyLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timer + Quit — Top Right (Quit always below Timer so they never overlap) */}
      <div className="absolute top-1 lg:top-20 right-3 lg:right-6 flex flex-col items-end gap-2 lg:gap-2.5">
        {showTimer && (
          <div className="bg-gray-900/60 backdrop-blur-md rounded-xl px-3 lg:px-5 py-2 lg:py-3 border border-red-500/30 shadow-lg shadow-red-500/5 shrink-0">
            <div className="text-[10px] lg:text-xs text-gray-500 font-medium uppercase tracking-wider">{t("game.time")}</div>
            <div className={`text-2xl lg:text-4xl font-bold ${timeColor} transition-colors duration-300 tabular-nums`}>
              {timeLeft}s
            </div>
          </div>
        )}
        {onQuit && (
          <button
            type="button"
            onClick={onQuit}
            className="pointer-events-auto shrink-0 bg-gray-900/60 backdrop-blur-md hover:bg-red-600/80 text-gray-300 hover:text-white font-bold text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg shadow-lg transition-all duration-200 border border-gray-700/50 hover:border-red-400/50"
          >
            ✕ {t("game2.quit")}
          </button>
        )}
      </div>
    </div>
  );
}

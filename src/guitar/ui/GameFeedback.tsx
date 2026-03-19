import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameStatus, GameMode } from "../hooks/useChordGame";

interface GameFeedbackProps {
  gameStatus: GameStatus;
  gameMode?: GameMode;
  missingCount?: number;
}

export default function GameFeedback({ gameStatus, gameMode = "challenge", missingCount = 0 }: GameFeedbackProps) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  const isPractice = gameMode === "practice";

  useEffect(() => {
    if (gameStatus === "correct" || gameStatus === "wrong") {
      setShow(true);
      if (!isPractice) {
        const timer = setTimeout(() => setShow(false), 800);
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [gameStatus, isPractice]);

  if (!show || (gameStatus !== "correct" && gameStatus !== "wrong")) {
    return null;
  }

  const isCorrect = gameStatus === "correct";

  return (
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
    >
      <div
        className={`transition-all duration-300 ${
          show ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        <div
          className={`px-6 lg:px-12 py-4 lg:py-6 rounded-2xl border-2 ${
            isCorrect
              ? "bg-gray-900/90 border-green-500/50 shadow-green-500/20"
              : "bg-gray-900/90 border-red-500/50 shadow-red-500/20"
          } shadow-2xl backdrop-blur-md max-w-sm text-center`}
        >
          <div className={`text-3xl lg:text-5xl font-black drop-shadow-lg ${
            isCorrect ? "text-green-400" : "text-red-400"
          }`}>
            {isCorrect ? `✓ ${t("game.correct")}` : `✗ ${t("game.wrong")}`}
          </div>
          <div className="text-sm lg:text-base text-gray-400 mt-2">
            {isPractice ? (
              isCorrect
                ? t("mode.practiceCorrect")
                : missingCount > 0
                  ? t("mode.missingPositions", { count: missingCount })
                  : t("mode.practiceWrong")
            ) : (
              !isCorrect && t("game.penalty")
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

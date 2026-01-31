import { useEffect, useState } from "react";
import type { GameStatus } from "../hooks/useChordGame";

interface GameFeedbackProps {
  gameStatus: GameStatus;
}

export default function GameFeedback({ gameStatus }: GameFeedbackProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (gameStatus === "correct" || gameStatus === "wrong") {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

  if (!show || (gameStatus !== "correct" && gameStatus !== "wrong")) {
    return null;
  }

  const isCorrect = gameStatus === "correct";

  return (
    <>
      {/* Fullscreen overlay with glow/flash effect */}
      <div
        className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-300 ${
          isCorrect ? "bg-green-500/20" : "bg-red-500/20"
        } ${show ? "opacity-100" : "opacity-0"}`}
      />

      {/* Centered feedback message */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
      >
        <div
          className={`transition-all duration-300 ${
            show ? "scale-100 opacity-100" : "scale-50 opacity-0"
          } ${isCorrect ? "animate-bounce" : "animate-shake"}`}
        >
          <div
            className={`px-16 py-8 rounded-2xl border-4 ${
              isCorrect
                ? "bg-green-600/90 border-green-300 shadow-green-500/50"
                : "bg-red-600/90 border-red-300 shadow-red-500/50"
            } shadow-2xl backdrop-blur-md`}
          >
            <div className="text-6xl font-black text-white text-center drop-shadow-lg">
              {isCorrect ? "✓ CORRECT!" : "✗ WRONG!"}
            </div>
            {!isCorrect && (
              <div className="text-xl text-white/90 text-center mt-2">-2 seconds</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

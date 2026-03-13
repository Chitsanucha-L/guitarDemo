import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import GameCanvas from "../guitar/GameCanvas";
import GameHUD from "../guitar/ui/GameHUD";
import GameFeedback from "../guitar/ui/GameFeedback";
import LanguageSwitcher from "../guitar/ui/LanguageSwitcher";
import { useChordGame } from "../guitar/hooks/useChordGame";
import { useGameStats } from "../guitar/hooks/useGameStats";
import { stringToNote } from "../guitar/data/constants";
import type { Note } from "../guitar/data/types";
import type { StrumHandle } from "../guitar/GuitarModel";

const STRING_ORDER: Note[] = ["E6", "A", "D", "G", "B", "e1"];
const STRING_NAME_TO_NUM: Record<string, number> = {
  E6: 6, A: 5, D: 4, G: 3, B: 2, e1: 1,
};

export default function GamePage() {
  const { t } = useTranslation();
  const {
    currentChord,
    score,
    timeLeft,
    pressedPositions,
    gameStatus,
    correctCount,
    wrongCount,
    startGame,
    resetGame,
    registerPress,
    validateChord,
    clearPresses,
  } = useChordGame();

  const { stats, accuracy, recordGame, resetStats } = useGameStats();

  const strumRef = useRef<StrumHandle | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (gameStatus === "gameover" && !recordedRef.current) {
      recordedRef.current = true;
      recordGame(score, correctCount, wrongCount);
    }
    if (gameStatus === "idle" || gameStatus === "playing") {
      recordedRef.current = false;
    }
  }, [gameStatus, score, correctCount, wrongCount, recordGame]);

  // Keep a ref to the latest validateChord so the async check flow
  // always calls the most recent version (avoids stale closure).
  const validateRef = useRef(validateChord);
  validateRef.current = validateChord;

  const handleStringPress = useCallback(
    (stringNum: number, fret: number) => {
      const stringName = stringToNote[stringNum];
      if (stringName && gameStatus === "playing" && !isChecking) {
        registerPress(stringName, fret);
      }
    },
    [gameStatus, registerPress, isChecking],
  );

  const handleCheck = useCallback(async () => {
    if (gameStatus !== "playing" || isChecking || !currentChord) return;
    setIsChecking(true);

    // Build strum from what the PLAYER pressed (their highlighted positions).
    // Unpressed strings play as open (fret 0).
    const strumPositions: { stringNum: number; fret: number }[] = [];
    for (const name of STRING_ORDER) {
      const sNum = STRING_NAME_TO_NUM[name];
      const pressed = pressedPositions.find((p) => p.string === name);
      strumPositions.push({ stringNum: sNum, fret: pressed ? pressed.fret : 0 });
    }

    // Play the strum from strings 6→1
    if (strumRef.current && strumPositions.length > 0) {
      await strumRef.current.strumPositions(strumPositions);
      await new Promise((r) => setTimeout(r, 300));
    }

    // Validate using the latest closure
    validateRef.current();
    setIsChecking(false);
  }, [gameStatus, isChecking, currentChord, pressedPositions]);

  const pressCount = pressedPositions.length;

  return (
    <div className="w-screen h-screen relative">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white px-3 py-2 sm:p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="text-base sm:text-xl font-bold truncate mr-2">{t("game.title")}</h1>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link to="/" className="text-sm sm:text-base hover:text-yellow-400">{t("nav.home")}</Link>
          <Link to="/game" className="text-sm sm:text-base hover:text-yellow-400 text-yellow-400">{t("nav.gameMode")}</Link>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Main Content */}
      <div className="absolute top-10 sm:top-15 left-0 right-0 bottom-0 overflow-hidden bg-[#1a1a1a]">
        
        {/* 3D Canvas */}
        <GameCanvas
          currentChord={currentChord?.data || null}
          canPlay={gameStatus === "playing" && !isChecking}
          onStringPress={handleStringPress}
          pressedPositions={pressedPositions}
          strumRef={strumRef}
        />

        {/* Game HUD — stays visible during feedback so the player sees the chord / score */}
        {(gameStatus === "playing" || gameStatus === "correct" || gameStatus === "wrong") && currentChord && (
          <GameHUD 
            chordName={currentChord.name}
            score={score}
            timeLeft={timeLeft}
          />
        )}

        {/* Game Feedback */}
        <GameFeedback gameStatus={gameStatus} />

        {/* Start Screen */}
        {gameStatus === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="bg-gray-800/95 p-6 sm:p-12 rounded-2xl shadow-2xl border-2 border-yellow-500/50 text-center max-w-lg mx-4 pointer-events-auto">
              <h2 className="text-2xl sm:text-5xl font-bold text-yellow-400 mb-3 sm:mb-6">{t("game.startTitle")}</h2>
              <p className="text-gray-300 text-sm sm:text-lg mb-4 sm:mb-6 leading-relaxed">
                {t("game.instruction1")}<br />
                {t("game.instruction2")}<br />
                {t("game.instruction3")} <span className="text-cyan-400 font-bold">{t("game.instruction3check")}</span> {t("game.instruction3end")}<br />
                {t("game.correctLabel")} <span className="text-green-400 font-bold">{t("game.correctPoints")}</span>{" "}
                {t("game.wrongLabel")} <span className="text-red-400 font-bold">{t("game.wrongPenalty")}</span><br />
                <span className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4 block">{t("game.timeLimit")}</span>
              </p>

              {/* Stats summary */}
              {stats.totalGames > 0 && (
                <div className="mb-4 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-gray-700/60 rounded-lg p-2 sm:p-3">
                    <div className="text-[10px] sm:text-xs text-gray-400 uppercase">{t("stats.bestScore")}</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.bestScore}</div>
                  </div>
                  <div className="bg-gray-700/60 rounded-lg p-2 sm:p-3">
                    <div className="text-[10px] sm:text-xs text-gray-400 uppercase">{t("stats.accuracy")}</div>
                    <div className="text-xl sm:text-2xl font-bold text-cyan-400">{accuracy}%</div>
                  </div>
                  <div className="bg-gray-700/60 rounded-lg p-2 sm:p-3">
                    <div className="text-[10px] sm:text-xs text-gray-400 uppercase">{t("stats.totalGames")}</div>
                    <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalGames}</div>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  onClick={startGame}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-lg sm:text-2xl px-8 sm:px-12 py-3 sm:py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {t("game.startGame")}
                </button>
                {stats.totalGames > 0 && (
                  <button
                    onClick={() => { if (confirm(t("stats.resetConfirm"))) resetStats(); }}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-300 font-bold text-sm sm:text-base px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200"
                  >
                    {t("stats.resetStats")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameStatus === "gameover" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-md pointer-events-none">
            <div className="bg-gray-800/95 p-6 sm:p-12 rounded-2xl shadow-2xl border-2 border-red-500/50 text-center max-w-lg mx-4 pointer-events-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-red-400 mb-2 sm:mb-4">{t("game.gameOver")}</h2>

              {/* Score */}
              <div className="my-3 sm:my-6">
                <div className="text-gray-400 text-lg sm:text-xl mb-1">{t("game.finalScore")}</div>
                <div className="text-5xl sm:text-7xl font-black text-yellow-400">{score}</div>
                {score >= stats.bestScore && score > 0 && (
                  <div className="text-yellow-300 text-sm sm:text-base font-bold mt-1 animate-bounce">
                    🏆 {t("stats.newBest")}
                  </div>
                )}
              </div>

              {/* This game breakdown */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-gray-700/60 rounded-lg p-2 sm:p-3">
                  <div className="text-[10px] sm:text-xs text-gray-400 uppercase">{t("stats.totalCorrect")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">{correctCount}</div>
                </div>
                <div className="bg-gray-700/60 rounded-lg p-2 sm:p-3">
                  <div className="text-[10px] sm:text-xs text-gray-400 uppercase">{t("stats.totalWrong")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-red-400">{wrongCount}</div>
                </div>
                <div className="bg-gray-700/60 rounded-lg p-2 sm:p-3">
                  <div className="text-[10px] sm:text-xs text-gray-400 uppercase">{t("stats.accuracy")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-cyan-400">
                    {correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* All-time stats */}
              <div className="border-t border-gray-600/50 pt-3 sm:pt-4 mb-4 sm:mb-6">
                <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-2">{t("stats.title")}</div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-gray-700/40 rounded-lg p-1.5 sm:p-2">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase">{t("stats.bestScore")}</div>
                    <div className="text-lg sm:text-xl font-bold text-yellow-400">{stats.bestScore}</div>
                  </div>
                  <div className="bg-gray-700/40 rounded-lg p-1.5 sm:p-2">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase">{t("stats.accuracy")}</div>
                    <div className="text-lg sm:text-xl font-bold text-cyan-400">{accuracy}%</div>
                  </div>
                  <div className="bg-gray-700/40 rounded-lg p-1.5 sm:p-2">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase">{t("stats.totalGames")}</div>
                    <div className="text-lg sm:text-xl font-bold text-white">{stats.totalGames}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 sm:gap-4">
                <button
                  onClick={resetGame}
                  className="bg-blue-500 hover:bg-blue-400 text-white font-bold text-base sm:text-xl px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  {t("game.playAgain")}
                </button>
                <Link
                  to="/"
                  className="inline-block bg-gray-600 hover:bg-gray-500 text-white font-bold text-base sm:text-xl px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  {t("game.exit")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom action bar (only during playing) */}
        {gameStatus === "playing" && (
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-2 sm:gap-4">
            {/* Press counter + clear */}
            {pressCount > 0 && (
              <button
                onClick={clearPresses}
                disabled={isChecking}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white font-bold text-sm sm:text-lg px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg transition-all duration-200 border border-gray-500"
              >
                {t("game.clear")} ({pressCount})
              </button>
            )}

            {/* Check button */}
            <button
              onClick={handleCheck}
              disabled={isChecking || pressCount === 0}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 text-white font-bold text-lg sm:text-2xl px-8 sm:px-16 py-3 sm:py-4 rounded-xl shadow-2xl transition-all duration-200 transform hover:scale-105 border-2 border-green-400"
            >
              {isChecking ? t("game.listening") : t("game.checkChord")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

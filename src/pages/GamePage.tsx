import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import GameCanvas from "../guitar/GameCanvas";
import GameHUD from "../guitar/ui/GameHUD";
import GameFeedback from "../guitar/ui/GameFeedback";
import Navbar from "../guitar/ui/Navbar";
import MobileNav from "../guitar/ui/MobileNav";
import useIsMobileLike from "../guitar/hooks/useIsMobileLike";
import { useChordGame } from "../guitar/hooks/useChordGame";
import type { GameMode, GameDifficulty } from "../guitar/hooks/useChordGame";
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
  const isMobileLike = useIsMobileLike();
  const {
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
    startGame,
    resetGame,
    registerPress,
    registerBarre,
    validateChord,
    clearPresses,
    practiceNext,
    practiceRetry,
    clearedCount,
    poolSize,
  } = useChordGame();

  const { allStats, recordGame, getAccuracy } = useGameStats();

  const strumRef = useRef<StrumHandle | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>("practice");
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>("medium");
  const recordedRef = useRef(false);

  useEffect(() => {
    if ((gameStatus === "gameover" || gameStatus === "won") && !recordedRef.current) {
      recordedRef.current = true;
      recordGame(gameMode, gameDifficulty, score, correctCount, wrongCount);
    }
    if (gameStatus === "idle" || gameStatus === "playing") {
      recordedRef.current = false;
    }
  }, [gameStatus, gameMode, gameDifficulty, score, correctCount, wrongCount, recordGame]);

  const modeStats = allStats[selectedMode][selectedDifficulty];
  const modeAccuracy = getAccuracy(selectedMode, selectedDifficulty);
  const activeStats = allStats[gameMode][gameDifficulty];
  const activeAccuracy = getAccuracy(gameMode, gameDifficulty);

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

  const handleBarrePress = useCallback(
    (strings: { stringNum: number; fret: number }[]) => {
      if (gameStatus !== "playing" || isChecking || strings.length < 2) return;
      const fret = strings[0].fret;
      const stringNames = strings
        .map((s) => stringToNote[s.stringNum])
        .filter(Boolean) as string[];
      registerBarre(stringNames, fret);
    },
    [gameStatus, isChecking, registerBarre],
  );

  const handleCheck = useCallback(async () => {
    if (gameStatus !== "playing" || isChecking || !currentChord) return;
    setIsChecking(true);

    const strumPositions: { stringNum: number; fret: number }[] = [];
    for (const name of STRING_ORDER) {
      const sNum = STRING_NAME_TO_NUM[name];
      const pressed = pressedPositions.find((p) => p.string === name);
      strumPositions.push({ stringNum: sNum, fret: pressed ? pressed.fret : 0 });
    }

    if (strumRef.current && strumPositions.length > 0) {
      await strumRef.current.strumPositions(strumPositions);
      await new Promise((r) => setTimeout(r, 300));
    }

    validateRef.current();
    setIsChecking(false);
  }, [gameStatus, isChecking, currentChord, pressedPositions]);

  const pressCount = pressedPositions.length;
  const isPractice = gameMode === "practice";
  const isPlaying = gameStatus === "playing" || gameStatus === "correct" || gameStatus === "wrong";

  return (
    <div className="w-screen h-screen relative">
      {isMobileLike ? (
        <MobileNav chordName={currentChord?.name ?? null} rightModeLabel={t("nav.gameMode")} />
      ) : (
        <Navbar title={t("game.title")} activeLink="game" />
      )}

      {/* Main Content */}
      <div
        className="absolute left-0 right-0 bottom-0 overflow-hidden bg-[#111111]"
        style={{
          // Keep this as a plain rem/px value so we don't risk invalid CSS
          // (some browsers handle env(...) inconsistently).
          top: isMobileLike ? "3.5rem" : "3.75rem",
        }}
      >
        
        {/* 3D Canvas */}
        <GameCanvas
          currentChord={currentChord?.data || null}
          canPlay={gameStatus === "playing" && !isChecking}
          onStringPress={handleStringPress}
          onBarrePress={handleBarrePress}
          pressedPositions={pressedPositions}
          pressedBarre={pressedBarre}
          feedbackMarkers={feedbackMarkers}
          strumRef={strumRef}
        />

        {/* Game HUD */}
        {isPlaying && currentChord && (
          <GameHUD 
            chordName={currentChord.name}
            score={score}
            timeLeft={timeLeft}
            showTimer={!isPractice}
            gameMode={gameMode}
            difficultyLabel={t(`difficulty.${gameDifficulty}`)}
            clearedCount={clearedCount}
            poolSize={poolSize}
            onQuit={() => setShowQuitModal(true)}
          />
        )}

        {/* Game Feedback */}
        <GameFeedback gameStatus={gameStatus} gameMode={gameMode} missingCount={missingCount} />

        {/* Start Screen */}
        {gameStatus === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-md p-3 lg:p-5 rounded-2xl shadow-2xl border border-gray-700/50 text-center max-w-lg lg:mx-4 pointer-events-auto max-h-[75vh] lg:max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg lg:text-2xl lg:text-4xl font-bold text-yellow-400 mb-2 lg:mb-2 lg:mb-4">{t("game.startTitle")}</h2>

              {/* Difficulty + Mode row */}
              <div className="mb-2 lg:mb-4 text-left">
                <div className="text-gray-400 text-[10px] lg:text-xs lg:text-sm font-semibold uppercase tracking-wider mb-1 lg:mb-2">{t("difficulty.title")}</div>
                <div className="grid grid-cols-4 gap-1 lg:gap-2">
                  {(["easy", "medium", "hard", "veryHard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDifficulty(d)}
                      className={`rounded-lg lg:rounded-xl border px-1 lg:px-2 py-1 lg:py-2 lg:py-3 text-left transition-all ${
                        selectedDifficulty === d
                          ? "bg-cyan-600/40 border-cyan-400/60 text-white"
                          : "bg-gray-800/50 border-gray-600/50 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="text-[10px] lg:text-xs lg:text-sm font-bold leading-tight">{t(`difficulty.${d}`)}</div>
                      <div className="text-[10px] lg:text-[11px] text-gray-500 mt-0.5 leading-tight">{t(`difficulty.${d}Desc`)}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Mode Toggle */}
              <div className="mb-2 lg:mb-4">
                <div className="inline-flex rounded-xl overflow-hidden border border-gray-600/50 bg-gray-800/50">
                  <button
                    onClick={() => setSelectedMode("practice")}
                    className={`px-3 lg:px-6 py-1.5 lg:py-2.5 lg:py-3 text-xs lg:text-sm lg:text-base font-bold transition-all duration-200 ${
                      selectedMode === "practice"
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                        : "bg-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {t("mode.practice")}
                  </button>
                  <button
                    onClick={() => setSelectedMode("challenge")}
                    className={`px-3 lg:px-6 py-1.5 lg:py-2.5 lg:py-3 text-xs lg:text-sm lg:text-base font-bold transition-all duration-200 ${
                      selectedMode === "challenge"
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                        : "bg-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {t("mode.challenge")}
                  </button>
                </div>
                <p className="text-gray-500 text-[10px] lg:text-xs lg:text-sm mt-1 lg:mt-2">
                  {selectedMode === "practice" ? t("mode.practiceDesc") : t("mode.challengeDesc")}
                </p>
              </div>

              {/* Instructions — collapsed on mobile */}
              <div>
                <p className="text-gray-400 text-[11px] lg:text-sm mb-4 lg:mb-6 leading-relaxed">
                  {t("game.instruction1")}<br />
                  {t("game.instruction2")}<br />
                  {t("game.instruction3")} <span className="text-cyan-400 font-bold">{t("game.instruction3check")}</span> {t("game.instruction3end")}<br />
                  <span className="text-gray-500 text-[11px] lg:text-sm mt-1 block">
                    {selectedDifficulty === "easy" ? t("difficulty.barreEasy") : t("mode.barreHint")}
                  </span>
                  {selectedMode === "challenge" && (
                    <>
                      <br />
                      {t("game.correctLabel")} <span className="text-green-400 font-bold">{t("game.correctPoints")}</span>{" "}
                      {t("game.wrongLabel")} <span className="text-red-400 font-bold">{t("game.wrongPenalty")}</span>
                      <span className="text-xs lg:text-sm text-gray-500 mt-1 block">{t("game.timeLimit")}</span>
                    </>
                  )}
                </p>
              </div>
              <p className="lg:hidden text-gray-500 text-[10px] mb-2 leading-snug">
                {t("game.instruction1")} {t("game.instruction3")} <span className="text-cyan-400 font-bold">{t("game.instruction3check")}</span>
                {selectedMode === "challenge" && (
                  <span className="block mt-0.5">
                    {t("game.correctLabel")} <span className="text-green-400 font-bold">{t("game.correctPoints")}</span>{" · "}
                    {t("game.wrongLabel")} <span className="text-red-400 font-bold">{t("game.wrongPenalty")}</span>
                  </span>
                )}
              </p>

              {/* Stats summary — per mode */}
              {modeStats.totalGames > 0 && (
                <div className="mb-2 lg:mb-4 grid grid-cols-3 gap-1 lg:gap-2 lg:gap-3">
                  <div className="bg-gray-800/60 rounded-lg lg:rounded-xl p-1.5 lg:p-2 lg:p-3 border border-gray-700/30">
                    <div className="text-[9px] lg:text-xs text-gray-500 uppercase">{t("stats.bestScore")}</div>
                    <div className="text-base lg:text-lg lg:text-2xl font-bold text-yellow-400">{modeStats.bestScore}</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg lg:rounded-xl p-1.5 lg:p-2 lg:p-3 border border-gray-700/30">
                    <div className="text-[9px] lg:text-xs text-gray-500 uppercase">{t("stats.accuracy")}</div>
                    <div className="text-base lg:text-lg lg:text-2xl font-bold text-cyan-400">{modeAccuracy}%</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg lg:rounded-xl p-1.5 lg:p-2 lg:p-3 border border-gray-700/30">
                    <div className="text-[9px] lg:text-xs text-gray-500 uppercase">{t("stats.totalGames")}</div>
                    <div className="text-base lg:text-lg lg:text-2xl font-bold text-white">{modeStats.totalGames}</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => startGame(selectedMode, selectedDifficulty)}
                className="w-full lg:w-auto bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-sm lg:text-base lg:text-xl px-5 lg:px-6 lg:px-10 py-2.5 lg:py-2.5 lg:py-3.5 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-yellow-500/20"
              >
                {t("game.startGame")}
              </button>
            </div>
          </div>
        )}

        {/* Win — cleared full pool (every chord correct once) */}
        {gameStatus === "won" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-md pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-md p-4 lg:p-8 rounded-2xl shadow-2xl border border-green-500/40 text-center max-w-lg mx-4 pointer-events-auto">
              <h2 className="text-2xl lg:text-4xl font-bold text-green-400 mb-2 lg:mb-4">{t("game.youWin")}</h2>
              <p className="text-gray-300 text-sm lg:text-base mb-3 lg:mb-5">{t("game.youWinDesc", { count: poolSize })}</p>
              <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4 lg:mb-6">
                <div className="bg-gray-800/60 rounded-xl p-2 lg:p-3 border border-gray-700/30">
                  <div className="text-[10px] lg:text-xs text-gray-500 uppercase">{t("stats.totalCorrect")}</div>
                  <div className="text-lg lg:text-2xl font-bold text-green-400">{correctCount}</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-2 lg:p-3 border border-gray-700/30">
                  <div className="text-[10px] lg:text-xs text-gray-500 uppercase">{t("stats.totalWrong")}</div>
                  <div className="text-lg lg:text-2xl font-bold text-red-400">{wrongCount}</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-2 lg:p-3 border border-gray-700/30">
                  <div className="text-[10px] lg:text-xs text-gray-500 uppercase">{t("game.finalScore")}</div>
                  <div className="text-lg lg:text-2xl font-bold text-yellow-400">{score}</div>
                </div>
              </div>
              <div className="flex justify-center gap-3 lg:gap-4">
                <button
                  type="button"
                  onClick={resetGame}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold text-base lg:text-xl px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/20"
                >
                  {t("game.playAgain")}
                </button>
                <Link
                  to="/"
                  className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold text-base lg:text-xl px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  {t("game.exit")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen (challenge) */}
        {gameStatus === "gameover" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-md pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-md p-4 lg:p-8 rounded-2xl shadow-2xl border border-red-500/30 text-center max-w-lg mx-4 pointer-events-auto">
              <h2 className="text-2xl lg:text-4xl font-bold text-red-400 mb-2 lg:mb-4">{t("game.gameOver")}</h2>

              <div className="my-3 lg:my-6">
                <div className="text-gray-400 text-lg lg:text-xl mb-1">{t("game.finalScore")}</div>
                <div className="text-4xl lg:text-6xl font-black text-yellow-400">{score}</div>
                {score >= activeStats.bestScore && score > 0 && (
                  <div className="text-yellow-300 text-sm lg:text-base font-bold mt-1">
                    🏆 {t("stats.newBest")}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4 lg:mb-6">
                <div className="bg-gray-800/60 rounded-xl p-2 lg:p-3 border border-gray-700/30">
                  <div className="text-[10px] lg:text-xs text-gray-500 uppercase">{t("stats.totalCorrect")}</div>
                  <div className="text-lg lg:text-2xl font-bold text-green-400">{correctCount}</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-2 lg:p-3 border border-gray-700/30">
                  <div className="text-[10px] lg:text-xs text-gray-500 uppercase">{t("stats.totalWrong")}</div>
                  <div className="text-lg lg:text-2xl font-bold text-red-400">{wrongCount}</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-2 lg:p-3 border border-gray-700/30">
                  <div className="text-[10px] lg:text-xs text-gray-500 uppercase">{t("stats.accuracy")}</div>
                  <div className="text-lg lg:text-2xl font-bold text-cyan-400">
                    {correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700/50 pt-3 lg:pt-4 mb-4 lg:mb-6">
                <div className="text-xs lg:text-sm text-gray-500 uppercase tracking-wider mb-2">{t("stats.title")}</div>
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  <div className="bg-gray-800/40 rounded-lg p-1.5 lg:p-2">
                    <div className="text-[9px] lg:text-[10px] text-gray-500 uppercase">{t("stats.bestScore")}</div>
                    <div className="text-base lg:text-xl font-bold text-yellow-400">{activeStats.bestScore}</div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-1.5 lg:p-2">
                    <div className="text-[9px] lg:text-[10px] text-gray-500 uppercase">{t("stats.accuracy")}</div>
                    <div className="text-base lg:text-xl font-bold text-cyan-400">{activeAccuracy}%</div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-1.5 lg:p-2">
                    <div className="text-[9px] lg:text-[10px] text-gray-500 uppercase">{t("stats.totalGames")}</div>
                    <div className="text-base lg:text-xl font-bold text-white">{activeStats.totalGames}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 lg:gap-4">
                <button
                  onClick={resetGame}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-base lg:text-xl px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/20"
                >
                  {t("game.playAgain")}
                </button>
                <Link
                  to="/"
                  className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold text-base lg:text-xl px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  {t("game.exit")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        {gameStatus === "playing" && (
          <div className="absolute bottom-4 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-3 lg:gap-4">
            {pressCount > 0 && (
              <button
                onClick={clearPresses}
                disabled={isChecking}
                className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 disabled:opacity-40 text-gray-300 font-bold text-sm lg:text-lg px-5 lg:px-8 py-3 lg:py-4 rounded-xl shadow-lg transition-all duration-200 border border-gray-600/50"
              >
                {t("game.clear")} ({pressCount})
              </button>
            )}

            <button
              onClick={handleCheck}
              disabled={isChecking || pressCount === 0}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 text-white font-bold text-sm lg:text-xl px-6 lg:px-16 py-2.5 lg:py-4 rounded-xl shadow-2xl shadow-green-500/20 transition-all duration-200 transform hover:scale-105 border-2 border-green-400/50"
            >
              {isChecking ? t("game.listening") : t("game.checkChord")}
            </button>
          </div>
        )}

        {/* Practice mode: action buttons after check */}
        {isPractice && (gameStatus === "correct" || gameStatus === "wrong") && (
          <div className="absolute bottom-4 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-3 lg:gap-4">
            {gameStatus === "wrong" && (
              <button
                onClick={practiceRetry}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm lg:text-xl px-6 lg:px-10 py-3 lg:py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 border-2 border-blue-400/50"
              >
                {t("mode.tryAgain")}
              </button>
            )}
            {gameStatus === "correct" && (
              <button
                onClick={practiceNext}
                className="bg-green-600 hover:bg-green-500 text-white font-bold text-sm lg:text-xl px-6 lg:px-10 py-3 lg:py-4 rounded-xl shadow-lg shadow-green-500/20 transition-all duration-200 border-2 border-green-400/50"
              >
                {t("mode.next")}
              </button>
            )}
          </div>
        )}

        {/* Feedback legend in practice mode */}
        {isPractice && feedbackMarkers.length > 0 && (
          <div className="absolute bottom-20 lg:bottom-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-lg px-3 lg:px-4 py-1.5 lg:py-2 flex items-center gap-3 lg:gap-4 text-[10px] lg:text-xs border border-gray-700/30">
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-green-400">{t("game.correct")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-red-400">{t("game.wrong")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quit confirmation modal */}
        {showQuitModal && (
          <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-md p-6 lg:p-10 rounded-2xl shadow-2xl border border-red-500/30 text-center max-w-sm mx-4 pointer-events-auto">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">{t("game2.quitTitle")}</h3>
              <p className="text-gray-400 text-sm lg:text-base mb-6">{t("game2.quitMessage")}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowQuitModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm lg:text-base px-6 py-2.5 rounded-lg transition-all duration-200"
                >
                  {t("game2.cancel")}
                </button>
                <button
                  onClick={() => {
                    setShowQuitModal(false);
                    if (isPractice && (correctCount > 0 || wrongCount > 0) && !recordedRef.current) {
                      recordedRef.current = true;
                      recordGame(gameMode, gameDifficulty, score, correctCount, wrongCount);
                    }
                    resetGame();
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm lg:text-base px-6 py-2.5 rounded-lg transition-all duration-200"
                >
                  {t("game2.confirmQuit")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

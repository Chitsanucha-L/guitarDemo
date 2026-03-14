import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import GameCanvas from "../guitar/GameCanvas";
import GameHUD from "../guitar/ui/GameHUD";
import GameFeedback from "../guitar/ui/GameFeedback";
import LanguageSwitcher from "../guitar/ui/LanguageSwitcher";
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
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-md text-white px-3 py-2 sm:p-4 flex justify-between items-center shadow-lg z-10 border-b border-gray-700/50">
        <h1 className="text-base sm:text-xl font-bold truncate mr-2">{t("game.title")}</h1>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link to="/" className="text-sm sm:text-base hover:text-yellow-400 transition-colors">{t("nav.home")}</Link>
          <Link to="/game" className="text-sm sm:text-base text-yellow-400">{t("nav.gameMode")}</Link>
          <Link to="/songs" className="text-sm sm:text-base hover:text-yellow-400 transition-colors">{t("nav.songMode")}</Link>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Main Content */}
      <div className="absolute top-10 sm:top-15 left-0 right-0 bottom-0 overflow-hidden bg-[#111111]">
        
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
            <div className="bg-gray-900/95 backdrop-blur-md p-6 sm:p-12 rounded-2xl shadow-2xl border border-gray-700/50 text-center max-w-2xl mx-4 pointer-events-auto max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl sm:text-5xl font-bold text-yellow-400 mb-3 sm:mb-6">{t("game.startTitle")}</h2>

              {/* Difficulty */}
              <div className="mb-4 sm:mb-6 text-left">
                <div className="text-gray-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">{t("difficulty.title")}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["easy", "medium", "hard", "veryHard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDifficulty(d)}
                      className={`rounded-xl border px-2 py-2 sm:py-3 text-left transition-all ${
                        selectedDifficulty === d
                          ? "bg-cyan-600/40 border-cyan-400/60 text-white"
                          : "bg-gray-800/50 border-gray-600/50 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold">{t(`difficulty.${d}`)}</div>
                      <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">{t(`difficulty.${d}Desc`)}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Mode Toggle */}
              <div className="mb-4 sm:mb-6">
                <div className="inline-flex rounded-xl overflow-hidden border border-gray-600/50 bg-gray-800/50">
                  <button
                    onClick={() => setSelectedMode("practice")}
                    className={`px-4 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-all duration-200 ${
                      selectedMode === "practice"
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                        : "bg-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {t("mode.practice")}
                  </button>
                  <button
                    onClick={() => setSelectedMode("challenge")}
                    className={`px-4 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-all duration-200 ${
                      selectedMode === "challenge"
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                        : "bg-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {t("mode.challenge")}
                  </button>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mt-2">
                  {selectedMode === "practice" ? t("mode.practiceDesc") : t("mode.challengeDesc")}
                </p>
              </div>

              <p className="text-gray-400 text-xs sm:text-base mb-4 sm:mb-6 leading-relaxed">
                {t("game.instruction1")}<br />
                {t("game.instruction2")}<br />
                {t("game.instruction3")} <span className="text-cyan-400 font-bold">{t("game.instruction3check")}</span> {t("game.instruction3end")}<br />
                <span className="text-gray-500 text-[10px] sm:text-xs mt-1 block">
                  {selectedDifficulty === "easy" ? t("difficulty.barreEasy") : t("mode.barreHint")}
                </span>
                {selectedMode === "challenge" && (
                  <>
                    <br />
                    {t("game.correctLabel")} <span className="text-green-400 font-bold">{t("game.correctPoints")}</span>{" "}
                    {t("game.wrongLabel")} <span className="text-red-400 font-bold">{t("game.wrongPenalty")}</span>
                    <span className="text-xs sm:text-sm text-gray-500 mt-1 block">{t("game.timeLimit")}</span>
                  </>
                )}
              </p>

              {/* Stats summary — per mode */}
              {modeStats.totalGames > 0 && (
                <div className="mb-4 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                    <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("stats.bestScore")}</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-400">{modeStats.bestScore}</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                    <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("stats.accuracy")}</div>
                    <div className="text-xl sm:text-2xl font-bold text-cyan-400">{modeAccuracy}%</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                    <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("stats.totalGames")}</div>
                    <div className="text-xl sm:text-2xl font-bold text-white">{modeStats.totalGames}</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => startGame(selectedMode, selectedDifficulty)}
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-lg sm:text-2xl px-8 sm:px-12 py-3 sm:py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-yellow-500/20"
              >
                {t("game.startGame")}
              </button>
            </div>
          </div>
        )}

        {/* Win — cleared full pool (every chord correct once) */}
        {gameStatus === "won" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-md pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-md p-6 sm:p-12 rounded-2xl shadow-2xl border border-green-500/40 text-center max-w-lg mx-4 pointer-events-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-green-400 mb-2 sm:mb-4">{t("game.youWin")}</h2>
              <p className="text-gray-300 text-sm sm:text-lg mb-4 sm:mb-6">{t("game.youWinDesc", { count: poolSize })}</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("stats.totalCorrect")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">{correctCount}</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("stats.totalWrong")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-red-400">{wrongCount}</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("game.finalScore")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-400">{score}</div>
                </div>
              </div>
              <div className="flex justify-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={resetGame}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold text-base sm:text-xl px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/20"
                >
                  {t("game.playAgain")}
                </button>
                <Link
                  to="/"
                  className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold text-base sm:text-xl px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
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
            <div className="bg-gray-900/95 backdrop-blur-md p-6 sm:p-12 rounded-2xl shadow-2xl border border-red-500/30 text-center max-w-lg mx-4 pointer-events-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-red-400 mb-2 sm:mb-4">{t("game.gameOver")}</h2>

              <div className="my-3 sm:my-6">
                <div className="text-gray-400 text-lg sm:text-xl mb-1">{t("game.finalScore")}</div>
                <div className="text-5xl sm:text-7xl font-black text-yellow-400">{score}</div>
                {score >= activeStats.bestScore && score > 0 && (
                  <div className="text-yellow-300 text-sm sm:text-base font-bold mt-1 animate-bounce">
                    🏆 {t("stats.newBest")}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("stats.totalCorrect")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">{correctCount}</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("stats.totalWrong")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-red-400">{wrongCount}</div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("stats.accuracy")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-cyan-400">
                    {correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700/50 pt-3 sm:pt-4 mb-4 sm:mb-6">
                <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-2">{t("stats.title")}</div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-gray-800/40 rounded-lg p-1.5 sm:p-2">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase">{t("stats.bestScore")}</div>
                    <div className="text-lg sm:text-xl font-bold text-yellow-400">{activeStats.bestScore}</div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-1.5 sm:p-2">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase">{t("stats.accuracy")}</div>
                    <div className="text-lg sm:text-xl font-bold text-cyan-400">{activeAccuracy}%</div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-1.5 sm:p-2">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase">{t("stats.totalGames")}</div>
                    <div className="text-lg sm:text-xl font-bold text-white">{activeStats.totalGames}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 sm:gap-4">
                <button
                  onClick={resetGame}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-base sm:text-xl px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/20"
                >
                  {t("game.playAgain")}
                </button>
                <Link
                  to="/"
                  className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold text-base sm:text-xl px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  {t("game.exit")}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        {gameStatus === "playing" && (
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-3 sm:gap-4">
            {pressCount > 0 && (
              <button
                onClick={clearPresses}
                disabled={isChecking}
                className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 disabled:opacity-40 text-gray-300 font-bold text-sm sm:text-lg px-5 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg transition-all duration-200 border border-gray-600/50"
              >
                {t("game.clear")} ({pressCount})
              </button>
            )}

            <button
              onClick={handleCheck}
              disabled={isChecking || pressCount === 0}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 text-white font-bold text-lg sm:text-2xl px-10 sm:px-16 py-3.5 sm:py-4 rounded-xl shadow-2xl shadow-green-500/20 transition-all duration-200 transform hover:scale-105 border-2 border-green-400/50"
            >
              {isChecking ? t("game.listening") : t("game.checkChord")}
            </button>
          </div>
        )}

        {/* Practice mode: action buttons after check */}
        {isPractice && (gameStatus === "correct" || gameStatus === "wrong") && (
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-3 sm:gap-4">
            {gameStatus === "wrong" && (
              <button
                onClick={practiceRetry}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-xl px-6 sm:px-10 py-3 sm:py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 border-2 border-blue-400/50"
              >
                {t("mode.tryAgain")}
              </button>
            )}
            {gameStatus === "correct" && (
              <button
                onClick={practiceNext}
                className="bg-green-600 hover:bg-green-500 text-white font-bold text-sm sm:text-xl px-6 sm:px-10 py-3 sm:py-4 rounded-xl shadow-lg shadow-green-500/20 transition-all duration-200 border-2 border-green-400/50"
              >
                {t("mode.next")}
              </button>
            )}
          </div>
        )}

        {/* Feedback legend in practice mode */}
        {isPractice && feedbackMarkers.length > 0 && (
          <div className="absolute bottom-20 sm:bottom-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs border border-gray-700/30">
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
            <div className="bg-gray-900/95 backdrop-blur-md p-6 sm:p-10 rounded-2xl shadow-2xl border border-red-500/30 text-center max-w-sm mx-4 pointer-events-auto">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t("game2.quitTitle")}</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-6">{t("game2.quitMessage")}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowQuitModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm sm:text-base px-6 py-2.5 rounded-lg transition-all duration-200"
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
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base px-6 py-2.5 rounded-lg transition-all duration-200"
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

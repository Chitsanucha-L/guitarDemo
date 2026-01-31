import { Link } from "react-router-dom";
import { useCallback } from "react";
import GameCanvas from "../guitar/GameCanvas";
import GameHUD from "../guitar/ui/GameHUD";
import GameFeedback from "../guitar/ui/GameFeedback";
import { useChordGame } from "../guitar/hooks/useChordGame";
import { stringToNote } from "../guitar/data/constants";

export default function GamePage() {
  const {
    currentChord,
    score,
    timeLeft,
    gameStatus,
    startGame,
    resetGame,
    registerPress,
    validateChord,
  } = useChordGame();

  // Memoized handler to prevent Canvas re-renders
  const handleStringPress = useCallback(
    (stringNum: number, fret: number) => {
      const stringName = stringToNote[stringNum];
      if (stringName && gameStatus === "playing") {
        registerPress(stringName, fret);
      }
    },
    [gameStatus, registerPress]
  );

  return (
    <div className="w-screen h-screen relative">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="text-xl font-bold">Guitar Trainer - Game Mode</h1>
        <div className="space-x-4">
          <Link to="/" className="hover:text-yellow-400">Home</Link>
          <Link to="/game" className="hover:text-yellow-400 text-yellow-400">Game Mode</Link>
        </div>
      </nav>

      {/* Main Content - Canvas + UI Overlays */}
      <div className="absolute top-15 left-0 right-0 bottom-0 overflow-hidden bg-[#1a1a1a]">
        
        {/* 3D Canvas - Always Mounted */}
        <GameCanvas
          currentChord={currentChord?.data || null}
          canPlay={gameStatus === "playing"}
          onStringPress={handleStringPress}
        />

        {/* UI Overlays - Absolutely Positioned */}
        
        {/* Game HUD */}
        {gameStatus === "playing" && currentChord && (
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
            <div className="bg-gray-800/95 p-12 rounded-2xl shadow-2xl border-2 border-yellow-500/50 text-center max-w-lg pointer-events-auto">
              <h2 className="text-5xl font-bold text-yellow-400 mb-6">Chord Training Game</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Press the correct chord positions on the guitar.<br />
                Correct answers: <span className="text-green-400 font-bold">+1 point</span><br />
                Wrong answers: <span className="text-red-400 font-bold">-2 seconds</span><br />
                <span className="text-sm text-gray-400 mt-4 block">Time limit: 30 seconds</span>
              </p>
              <button
                onClick={startGame}
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-2xl px-12 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameStatus === "gameover" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-md pointer-events-none">
            <div className="bg-gray-800/95 p-12 rounded-2xl shadow-2xl border-2 border-red-500/50 text-center max-w-lg pointer-events-auto">
              <h2 className="text-5xl font-bold text-red-400 mb-4">GAME OVER</h2>
              <div className="my-8">
                <div className="text-gray-400 text-xl mb-2">Final Score</div>
                <div className="text-7xl font-black text-yellow-400">{score}</div>
              </div>
              <div className="space-x-4">
                <button
                  onClick={resetGame}
                  className="bg-blue-500 hover:bg-blue-400 text-white font-bold text-xl px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Play Again
                </button>
                <Link
                  to="/"
                  className="inline-block bg-gray-600 hover:bg-gray-500 text-white font-bold text-xl px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Exit
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Validate Button (only during playing) */}
        {gameStatus === "playing" && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
            <button
              onClick={validateChord}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-2xl px-16 py-4 rounded-xl shadow-2xl transition-all duration-200 transform hover:scale-105 border-2 border-green-400"
            >
              CHECK CHORD
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

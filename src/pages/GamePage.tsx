import { Link } from "react-router-dom";
import { useCallback, useRef, useState } from "react";
import GameCanvas from "../guitar/GameCanvas";
import GameHUD from "../guitar/ui/GameHUD";
import GameFeedback from "../guitar/ui/GameFeedback";
import { useChordGame } from "../guitar/hooks/useChordGame";
import { stringToNote } from "../guitar/data/constants";
import type { Note } from "../guitar/data/types";
import type { StrumHandle } from "../guitar/GuitarModel";

const STRING_ORDER: Note[] = ["E6", "A", "D", "G", "B", "e1"];
const STRING_NAME_TO_NUM: Record<string, number> = {
  E6: 6, A: 5, D: 4, G: 3, B: 2, e1: 1,
};

export default function GamePage() {
  const {
    currentChord,
    score,
    timeLeft,
    pressedPositions,
    gameStatus,
    startGame,
    resetGame,
    registerPress,
    validateChord,
    clearPresses,
  } = useChordGame();

  const strumRef = useRef<StrumHandle | null>(null);
  const [isChecking, setIsChecking] = useState(false);

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
      <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="text-xl font-bold">Guitar Trainer - Game Mode</h1>
        <div className="space-x-4">
          <Link to="/" className="hover:text-yellow-400">Home</Link>
          <Link to="/game" className="hover:text-yellow-400 text-yellow-400">Game Mode</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="absolute top-15 left-0 right-0 bottom-0 overflow-hidden bg-[#1a1a1a]">
        
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
            <div className="bg-gray-800/95 p-12 rounded-2xl shadow-2xl border-2 border-yellow-500/50 text-center max-w-lg pointer-events-auto">
              <h2 className="text-5xl font-bold text-yellow-400 mb-6">Chord Training Game</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Tap the fretted positions on the guitar to build the chord.<br />
                Open strings are played automatically — you only press frets!<br />
                Tap a fret again to remove it. Press <span className="text-cyan-400 font-bold">CHECK</span> when ready.<br />
                Correct: <span className="text-green-400 font-bold">+1 point</span>{" "}
                Wrong: <span className="text-red-400 font-bold">-2 seconds</span><br />
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

        {/* Bottom action bar (only during playing) */}
        {gameStatus === "playing" && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-4">
            {/* Press counter + clear */}
            {pressCount > 0 && (
              <button
                onClick={clearPresses}
                disabled={isChecking}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg transition-all duration-200 border border-gray-500"
              >
                CLEAR ({pressCount})
              </button>
            )}

            {/* Check button */}
            <button
              onClick={handleCheck}
              disabled={isChecking || pressCount === 0}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 text-white font-bold text-2xl px-16 py-4 rounded-xl shadow-2xl transition-all duration-200 transform hover:scale-105 border-2 border-green-400"
            >
              {isChecking ? "LISTENING..." : "CHECK CHORD"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

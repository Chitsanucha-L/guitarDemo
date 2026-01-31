interface GameHUDProps {
  chordName: string | null;
  score: number;
  timeLeft: number;
}

export default function GameHUD({ chordName, score, timeLeft }: GameHUDProps) {
  const timeColor = timeLeft <= 5 ? "text-red-500" : timeLeft <= 10 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="absolute top-0 left-0 w-full h-32 pointer-events-none z-50">
      {/* Score - Top Left */}
      <div className="absolute top-20 left-8">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3 border-2 border-blue-500/50">
          <div className="text-sm text-gray-400 font-medium">SCORE</div>
          <div className="text-4xl font-bold text-white">{score}</div>
        </div>
      </div>

      {/* Chord Name - Top Center */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/80 backdrop-blur-md rounded-xl px-12 py-4 border-3 border-yellow-500/60 shadow-2xl">
          <div className="text-sm text-gray-400 font-medium text-center mb-1">PLAY THIS CHORD</div>
          <div className="text-6xl font-bold text-yellow-400 tracking-wider drop-shadow-lg">
            {chordName || "---"}
          </div>
        </div>
      </div>

      {/* Timer - Top Right */}
      <div className="absolute top-20 right-8">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3 border-2 border-red-500/50">
          <div className="text-sm text-gray-400 font-medium">TIME</div>
          <div className={`text-4xl font-bold ${timeColor} transition-colors duration-300`}>
            {timeLeft}s
          </div>
        </div>
      </div>
    </div>
  );
}

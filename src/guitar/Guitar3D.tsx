import { useState, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useProgress } from "@react-three/drei";
import type { ChordData } from "./data/types";
import type { ChordVoicing } from "./data/chordLibrary";
import { resolveChordByName } from "./data/chordLibrary";
import GuitarModel from "./GuitarModel";
import ChordSelector from "./ui/ChordSelector";
import PickToggle from "./ui/PickToggle";
import CurrentNoteDisplay from "./ui/CurrentNoteDisplay";
import FingerLegend from "./ui/FingerLegend";

function LoadingScreen() {
  const { progress, active } = useProgress();

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a1a1a]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
          <div
            className="absolute inset-0 rounded-full border-4 border-t-yellow-400 animate-spin"
          />
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-semibold">Loading Guitar Model</p>
          <p className="text-gray-400 text-sm mt-1">{progress.toFixed(0)}%</p>
        </div>
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Guitar3D() {
  const { active: isLoading } = useProgress();
  const [highlightChord, setHighlightChord] = useState<ChordData | null>(null);
  const [selectedChordName, setSelectedChordName] = useState<string | null>(null);
  const [isHoldingPick, setIsHoldingPick] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>("");
  const previousChordRef = useRef<ChordData | null>(null);

  const handleChordSelect = (chordName: string, voicing?: ChordVoicing) => {
    const newChord = voicing ? voicing.data : resolveChordByName(chordName);
    previousChordRef.current = highlightChord;
    setHighlightChord(newChord);
    setSelectedChordName(chordName);
  };

  const handleClearChord = () => {
    previousChordRef.current = highlightChord;
    setHighlightChord(null);
    setSelectedChordName(null);
  };

  return (
    <div className="w-full max-w-screen h-screen relative overflow-hidden bg-[#1a1a1a]">

      <div className={`absolute top-16 left-5 w-full h-full z-50 pointer-events-none ${isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500"}`}>
        <div className={`space-y-3 max-w-md ${isLoading ? "pointer-events-none" : "pointer-events-auto"}`}>
          <ChordSelector 
            selectedChordName={selectedChordName}
            onSelect={handleChordSelect}
            onClear={handleClearChord}
          />

          <PickToggle 
            isHoldingPick={isHoldingPick}
            onToggle={() => setIsHoldingPick(!isHoldingPick)}
          />

          <CurrentNoteDisplay currentNote={currentNote} />
        </div>
      </div>

      <div className={isLoading ? "opacity-0 pointer-events-none" : "opacity-100 transition-opacity duration-500"}>
        <FingerLegend highlightChord={highlightChord} />
      </div>

      <LoadingScreen />

      {/* ✅ Canvas */}
      <Canvas shadows camera={{ position: [0.3, 6, 0.01], fov: 30 }} gl={{ preserveDrawingBuffer: true }} className="pointer-events-auto">
        <Suspense fallback={null}>
          <Environment preset="apartment" />
          <GuitarModel 
            rotation={[0, -0.015, 0]}
            highlightChord={highlightChord} 
            previousChord={previousChordRef.current}
            canPlay={isHoldingPick} 
            onNotePlay={setCurrentNote}
          />
        </Suspense>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <OrbitControls enableDamping enableRotate={!isHoldingPick} />
      </Canvas>
    </div>
  );
}
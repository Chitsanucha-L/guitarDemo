import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import type { ChordData, TensionType } from "./data/types";
import { chords } from "./data/chords";
import { chordTensions } from "./data/chordTensions";
import GuitarModel from "./GuitarModel";
import ChordSelector from "./ui/ChordSelector";
import TensionSelector from "./ui/TensionSelector";
import PickToggle from "./ui/PickToggle";
import SelectedChordDisplay from "./ui/SelectedChordDisplay";
import CurrentNoteDisplay from "./ui/CurrentNoteDisplay";
import FingerLegend from "./ui/FingerLegend";

export default function Guitar3D() {
  const [highlightChord, setHighlightChord] = useState<ChordData | null>(null);
  const [selectedChordName, setSelectedChordName] = useState<string | null>(null);
  const [selectedTensions, setSelectedTensions] = useState<TensionType[]>([]);
  const [isHoldingPick, setIsHoldingPick] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>("");
  const previousChordRef = useRef<ChordData | null>(null);

  const handleChordSelect = (chordName: string) => {
    const newChord = chords[chordName];
    previousChordRef.current = highlightChord;
    setHighlightChord(newChord);
    setSelectedChordName(chordName);
    setSelectedTensions([]); // รีเซ็ต tension เมื่อเลือกคอร์ดใหม่
  };

  const handleClearChord = () => {
    previousChordRef.current = highlightChord;
    setHighlightChord(null);
    setSelectedChordName(null);
    setSelectedTensions([]);
  };

  const handleTensionToggle = (tension: TensionType) => {
    if (!selectedChordName) return;
    
    setSelectedTensions(prev => {
      const newTensions = prev.includes(tension)
        ? prev.filter(t => t !== tension) // ถ้ามีอยู่แล้ว ให้ลบออก
        : [...prev, tension]; // ถ้ายังไม่มี ให้เพิ่ม
      
      // Store current chord before updating
      previousChordRef.current = highlightChord;
      
      // อัพเดทคอร์ดตาม tension ที่เลือก
      if (newTensions.length === 0) {
        // ถ้าไม่มี tension เลย กลับไปใช้ base chord
        setHighlightChord(chords[selectedChordName]);
      } else {
        // ใช้ tension สุดท้ายที่เลือก (หรือสามารถใช้ logic การผสมที่ซับซ้อนกว่านี้)
        const lastTension = newTensions[newTensions.length - 1];
        if (chordTensions[selectedChordName]?.[lastTension]) {
          setHighlightChord(chordTensions[selectedChordName][lastTension]);
        }
      }
      
      return newTensions;
    });
  };

  return (
    <div className="w-full max-w-screen h-screen relative overflow-hidden bg-[#1a1a1a]">

      <div className="absolute top-16 left-5 w-full h-full z-50 pointer-events-none">
        <div className="pointer-events-auto space-y-3 max-w-md">
          <ChordSelector 
            selectedChordName={selectedChordName}
            onSelect={handleChordSelect}
            onClear={handleClearChord}
          />

          <SelectedChordDisplay selectedChordName={selectedChordName} />

          <TensionSelector
            selectedChordName={selectedChordName}
            selectedTensions={selectedTensions}
            onToggle={handleTensionToggle}
          />

          <PickToggle 
            isHoldingPick={isHoldingPick}
            onToggle={() => setIsHoldingPick(!isHoldingPick)}
          />

          <CurrentNoteDisplay currentNote={currentNote} />
        </div>
      </div>

      <FingerLegend highlightChord={highlightChord} />

      {/* ✅ Canvas */}
      <Canvas shadows camera={{ position: [0.3, 6, 0.01], fov: 30 }} gl={{ preserveDrawingBuffer: true }} className="pointer-events-auto">
        <Environment preset="apartment" />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <GuitarModel 
          rotation={[0, -0.015, 0]}
          highlightChord={highlightChord} 
          previousChord={previousChordRef.current}
          canPlay={isHoldingPick} 
          onNotePlay={setCurrentNote}
        />
        <OrbitControls enableDamping enableRotate={!isHoldingPick} />
      </Canvas>
    </div>
  );
}
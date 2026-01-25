import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

type Note = "E6" | "A" | "D" | "G" | "B" | "e1";
type Finger = 1 | 2 | 3 | 4;

// สีตามนิ้ว
const fingerColors: Record<Finger, string> = {
  1: "#ff2424",
  2: "#31adff",
  3: "#00ff00",
  4: "#ffae00",
};

// chords พร้อม fret + finger
const chords: Record<string, Record<Note, { fret: number; finger?: Finger }>> = {
  C: { E6: { fret: 0 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
  G: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 3, finger: 3 } },
  D: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 2, finger: 2 } },
  A: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 2, finger: 4 }, e1: { fret: 0 } },
  E: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } },
  F: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } },
  Am: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
  Em: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } },
  Dm: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 1, finger: 1 } },
};

// แยกคอร์ดเป็น major และ minor
const majorChords = ["C", "G", "D", "A", "E", "F"];
const minorChords = ["Am", "Em", "Dm"];

// Tension types
type TensionType = "7" | "maj7" | "sus4" | "add9";

// Chord tensions สำหรับแต่ละคอร์ด
const chordTensions: Record<string, Record<TensionType, Record<Note, { fret: number; finger?: Finger }>>> = {
  C: {
    "7": { E6: { fret: 0 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 3, finger: 4 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
    "maj7": { E6: { fret: 0 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } },
    "sus4": { E6: { fret: 0 }, A: { fret: 3, finger: 4 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 3, finger: 3 } },
    "add9": { E6: { fret: 0 }, A: { fret: 3, finger: 2 }, D: { fret: 2, finger: 1 }, G: { fret: 0 }, B: { fret: 3, finger: 3 }, e1: { fret: 0 } },
  },
  G: {
    "7": { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 1, finger: 1 } },
    "maj7": { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 2, finger: 1 } },
    "sus4": { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 1, finger: 3 }, e1: { fret: 3, finger: 4 } },
    "add9": { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 2, finger: 3 }, B: { fret: 0 }, e1: { fret: 3, finger: 4 } },
  },
  D: {
    "7": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 2, finger: 3 } },
    "maj7": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 2, finger: 2 }, e1: { fret: 2, finger: 3 } },
    "sus4": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 3, finger: 4 } },
    "add9": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 2 }, e1: { fret: 0 } },
  },
  A: {
    "7": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } },
    "maj7": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } },
    "sus4": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 3, finger: 4 }, e1: { fret: 0 } },
    "add9": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 2, finger: 2 }, e1: { fret: 0 } },
  },
  E: {
    "7": { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } },
    "maj7": { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 1, finger: 1 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } },
    "sus4": { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 2, finger: 4 }, B: { fret: 0 }, e1: { fret: 0 } },
    "add9": { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 3 }, B: { fret: 0 }, e1: { fret: 2, finger: 4 } },
  },
  F: {
    "7": { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } },
    "maj7": { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
    "sus4": { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 4 }, D: { fret: 3, finger: 3 }, G: { fret: 3, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } },
    "add9": { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 3, finger: 2 } },
  },
  Am: {
    "7": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
    "maj7": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
    "sus4": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 3, finger: 4 }, e1: { fret: 0 } },
    "add9": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 1, finger: 2 }, e1: { fret: 0 } },
  },
  Em: {
    "7": { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } },
    "maj7": { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 1, finger: 1 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } },
    "sus4": { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } },
    "add9": { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 2, finger: 3 } },
  },
  Dm: {
    "7": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } },
    "maj7": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 2, finger: 3 }, e1: { fret: 1, finger: 1 } },
    "sus4": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 3, finger: 3 } },
    "add9": { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 2 }, e1: { fret: 0 } },
  },
};

const meshToNote: Record<string, Note> = {
  String_6_0: "E6",
  String_5_0: "A",
  String_4_0: "D",
  String_3_0: "G",
  String_2_0: "B",
  String_1_0: "e1",
};

// แปลงจาก string number + fret เป็นชื่อโน้ต
const getNoteName = (stringNum: number, fret: number): string => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // Open string notes (MIDI note numbers)
  const openNotes: Record<number, number> = {
    1: 64, // E4
    2: 59, // B3
    3: 55, // G3
    4: 50, // D3
    5: 45, // A2
    6: 40, // E2
  };

  const midiNote = openNotes[stringNum] + fret;
  const octave = Math.floor((midiNote - 12) / 12);
  const noteName = notes[midiNote % 12];

  return `${noteName}${octave}`;
};

const fingerNames: Record<Finger, string> = {
  1: "นิ้วชี้",
  2: "นิ้วกลาง",
  3: "นิ้วนาง",
  4: "นิ้วก้อย",
};
export default function Guitar3D() {
  const [highlightChord, setHighlightChord] = useState<Record<Note, { fret: number; finger?: Finger }> | null>(null);
  const [selectedChordName, setSelectedChordName] = useState<string | null>(null);
  const [selectedTensions, setSelectedTensions] = useState<TensionType[]>([]);
  const [isHoldingPick, setIsHoldingPick] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>("");

  const handleChordSelect = (chordName: string) => {
    setHighlightChord(chords[chordName]);
    setSelectedChordName(chordName);
    setSelectedTensions([]); // รีเซ็ต tension เมื่อเลือกคอร์ดใหม่
  };

  const handleClearChord = () => {
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
        {/* ✅ ปุ่มเลือก Chord */}
        <div className="mt-4 space-y-3">
          {/* แถวที่ 1: Major Chords */}
          <div className="flex gap-2">
            <span className="text-white text-sm font-medium self-center mr-2">Major:</span>
            {majorChords.map(chord => {
              const isActive = selectedChordName === chord;
              return (
                <button
                  key={chord}
                  className={`px-4 py-2 text-white text-[18px] font-semibold rounded-md shadow-md transition-all duration-200 ${isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 ring-4 ring-blue-300 scale-110"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    }`}
                  onClick={() => handleChordSelect(chord)}
                >
                  {chord}
                </button>
              );
            })}
          </div>

          {/* แถวที่ 2: Minor Chords */}
          <div className="flex gap-2">
            <span className="text-white text-sm font-medium self-center mr-2">Minor:</span>
            {minorChords.map(chord => {
              const isActive = selectedChordName === chord;
              return (
                <button
                  key={chord}
                  className={`px-4 py-2 text-white text-[18px] font-semibold rounded-md shadow-md transition-all duration-200 ${isActive
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 ring-4 ring-purple-300 scale-110"
                      : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    }`}
                  onClick={() => handleChordSelect(chord)}
                >
                  {chord}
                </button>
              );
            })}
          </div>

          {/* แถวที่ 3: ปุ่มควบคุม */}
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-[16px] font-semibold rounded-md shadow-md transition"
              onClick={() => alert("เพิ่มคอร์ดใหม่")}
            >
              + More
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white text-[16px] font-medium rounded-md hover:bg-red-500 transition"
              onClick={handleClearChord}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ✅ แสดงคอร์ดที่เลือก */}
        {selectedChordName && (
          <div className="z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-xl pointer-events-auto w-fit">
            <div className="text-sm opacity-80">คอร์ดที่เลือก:</div>
            <div className="text-4xl font-bold">{selectedChordName}</div>
          </div>
        )}

        {/* ✅ Tension Label และปุ่ม */}
        {selectedChordName && chordTensions[selectedChordName] && (
          <>
            <div className="z-10 text-white text-sm font-medium pointer-events-none mb-1.5">
              Tension:
            </div>
            <div className="z-10 flex gap-3 pointer-events-auto">
              {Object.keys(chordTensions[selectedChordName]).map((tension) => {
                const tensionType = tension as TensionType;
                const isActive = selectedTensions.includes(tensionType);
                
                return (
                  <button
                    key={tension}
                    className={`px-2 py-1 text-sm font-bold rounded-md shadow-md transition-all duration-300 border-2 ${
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-300 scale-105 shadow-green-500/50"
                        : "bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
                    }`}
                    onClick={() => handleTensionToggle(tensionType)}
                  >
                    <span className="flex items-center gap-1">
                      {isActive && <span className="text-sm">✅</span>}
                      {!isActive && <span className="text-sm opacity-50">⬜</span>}
                      {tension}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ✅ ปุ่มถือปิ๊ก */}
        <div className={`z-10 transition-all duration-300 pointer-events-auto`}>
          <button
            onClick={() => setIsHoldingPick(!isHoldingPick)}
            className={`px-4 py-2 rounded-md transition font-medium text-[16px] ${isHoldingPick ? "bg-orange-500 text-white" : "bg-white text-black"}`}
          >
            {isHoldingPick ? "ถือปิ๊ก ✅" : "ไม่ถือปิ๊ก ❌"}
          </button>
        </div>

        {/* ✅ แสดงโน้ตที่กำลังเล่น */}
        {currentNote && (
          <div className="absolute top-5 right-5 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg shadow-xl pointer-events-auto">
            <div className="text-sm opacity-80">กำลังเล่น:</div>
            <div className="text-3xl font-bold">{currentNote}</div>
          </div>
        )}
        </div>
      </div>

      {/* ✅ Legend อธิบายสีแต่ละนิ้ว */}
      {highlightChord && (
        <div className="absolute bottom-5 right-5 z-50 bg-black bg-opacity-60 text-white p-3 rounded pointer-events-auto">
          {Object.entries(highlightChord).map(([note, { finger, fret }]) => {
            if (!finger || fret === 0) return null;
            return (
              <div key={note} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: fingerColors[finger] }} />
                <span>{note}: {fingerNames[finger]}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ Canvas */}
      <Canvas shadows camera={{ position: [0.3, 4, 0.01], fov: 50 }} gl={{ preserveDrawingBuffer: true }} className="pointer-events-auto">
        <Environment preset="apartment" />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <GuitarModel highlightChord={highlightChord} canPlay={isHoldingPick} onNotePlay={setCurrentNote} />
        <OrbitControls enableDamping enableRotate={!isHoldingPick} />
      </Canvas>
    </div>
  );
}


function GuitarModel({
  highlightChord,
  canPlay,
  onNotePlay
}: {
  highlightChord: Record<Note, { fret: number; finger?: Finger }> | null;
  canPlay: boolean;
  onNotePlay: (note: string) => void;
}) {
  const { scene } = useGLTF("/models/guitar.glb") as any;
  const audioContext = useMemo(() => new (window.AudioContext || (window as any).webkitAudioContext)(), []);
  const sounds = useMemo<{ [key: string]: AudioBuffer }>(() => ({}), []);
  const volume = 0.3;

  const stringMeshes = useRef<THREE.Mesh[]>([]);
  const lastPlayed = useRef<{ meshName: string; time: number } | null>(null);
  const isDragging = useRef(false);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const currentHitbox = useRef<string | null>(null); // จำ hitbox ปัจจุบันที่เมาส์อยู่
  const isStrumming = useRef(false); // ป้องกันการ strum ซ้อนกัน
  const noteDisplayTimeout = useRef<number | null>(null); // เก็บ timeout ID สำหรับซ่อนโน้ต

  // โหลดเสียงทุกไฟล์
  useEffect(() => {
    async function loadSounds() {
      // โหลดเสียงทุกสาย (1-6) ทุก fret (0-20)
      for (let stringNum = 1; stringNum <= 6; stringNum++) {
        for (let fret = 0; fret <= 20; fret++) {
          const meshName = `String_${stringNum}_${fret}`;
          try {
            const res = await fetch(`/sounds/${meshName}.mp3`);
            const buf = await res.arrayBuffer();
            sounds[meshName] = await audioContext.decodeAudioData(buf);
          } catch (err) {
            console.warn(`Cannot load ${meshName}`, err);
          }
        }
      }
    }
    loadSounds();

    // Cleanup: ล้าง timeout เมื่อ component ถูก unmount
    return () => {
      if (noteDisplayTimeout.current) {
        clearTimeout(noteDisplayTimeout.current);
      }
    };
  }, [audioContext, sounds]);

  // assign metadata ให้ mesh ทุกสายทุก fret และสร้าง hitbox
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    const hitboxGroup = new THREE.Group();
    hitboxGroup.name = "StringHitboxes";

    // ลบ hitbox เก่าถ้ามี
    const oldHitboxes = scene.getObjectByName("StringHitboxes");
    if (oldHitboxes) scene.remove(oldHitboxes);

    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        // ตรวจสอบว่าชื่อ mesh เป็นรูปแบบ String_X_Y หรือไม่
        const match = child.name.match(/^String_(\d+)_(\d+)$/);
        if (match) {
          const stringNum = parseInt(match[1]);
          const fret = parseInt(match[2]);
          (child as any).userData.stringNum = stringNum;
          (child as any).userData.fret = fret;
          (child as any).userData.meshName = child.name;

          // assign note สำหรับ open strings (fret 0) เพื่อใช้กับ chord highlighting
          if (meshToNote[child.name]) {
            (child as any).userData.note = meshToNote[child.name];
          }

          // สร้าง invisible hitbox ที่ใหญ่กว่า
          const stringMesh = child as THREE.Mesh;
          const box = new THREE.Box3().setFromObject(stringMesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // สร้าง hitbox 
          const hitboxGeometry = new THREE.BoxGeometry(
            0.03, 
            0.01, 
            size.z - 0.01 
          );

          const hitboxMaterial = new THREE.MeshBasicMaterial({
            visible: false,
            transparent: true,
            opacity: 0,
          });

          const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
          hitbox.position.copy(center);
          hitbox.userData.stringNum = stringNum;
          hitbox.userData.fret = fret;
          hitbox.userData.meshName = child.name;

          if (meshToNote[child.name]) {
            hitbox.userData.note = meshToNote[child.name];
          }

          hitboxGroup.add(hitbox);
          meshes.push(hitbox);
        }
      }
    });

    scene.add(hitboxGroup);
    stringMeshes.current = meshes;
  }, [scene]);

  // highlight marker
  useEffect(() => {
    const oldMarkers = scene.getObjectByName("HighlightMarkers");
    if (oldMarkers) scene.remove(oldMarkers);
    if (!highlightChord) return;

    const markerGroup = new THREE.Group();
    markerGroup.name = "HighlightMarkers";

    // Position offset ที่ตรงกับ primitive position
    const modelOffset = new THREE.Vector3(-0.12, 0, 0.06);

    // รวบรวมข้อมูลทุกตำแหน่งก่อน
    const positions: Array<{
      note: Note;
      fret: number;
      finger?: Finger;
      stringPos: THREE.Vector3;
      fretPos: THREE.Vector3;
      xOffset: number;
      yOffset: number;
    }> = [];

    scene.traverse((child: THREE.Object3D) => {
      // ข้าม hitbox ที่อยู่ใน StringHitboxes group
      if (child.parent?.name === "StringHitboxes") return;

      const note: Note = (child as any).userData.note;
      if (!note || !(note in highlightChord)) return;
      const chordNote = highlightChord[note];
      if (!chordNote || chordNote.fret === 0) return;

      const fretMesh = scene.getObjectByName("Fret" + chordNote.fret);
      if (!fretMesh) return;

      const stringPos = new THREE.Vector3();
      child.getWorldPosition(stringPos);
      const fretPos = new THREE.Vector3();
      fretMesh.getWorldPosition(fretPos);

      let xOffset = 0;
      if (note === "E6") xOffset = 0.02;
      if (note === "A") xOffset = 0.01;
      if (note === "D") xOffset = 0.003;
      if (note === "G") xOffset = -0.004;
      if (note === "B") xOffset = -0.013;
      if (note === "e1") xOffset = -0.02;

      let yOffset = -0.008;
      if (note === "E6") yOffset = -0.002;

      positions.push({
        note,
        fret: chordNote.fret,
        finger: chordNote.finger,
        stringPos,
        fretPos,
        xOffset,
        yOffset,
      });
    });

    // หา barre (นิ้วเดียวกันที่ fret เดียวกัน กดหลายสาย)
    const barreMap: Record<string, typeof positions> = {};
    const usedPositions = new Set<number>();

    positions.forEach((pos) => {
      if (pos.finger) {
        const key = `${pos.finger}-${pos.fret}`;
        if (!barreMap[key]) barreMap[key] = [];
        barreMap[key].push(pos);
      }
    });

    // สร้าง barre bars
    Object.entries(barreMap).forEach(([_, barrePositions]) => {
      if (barrePositions.length >= 2) {
        // มีอย่างน้อย 2 สายที่ใช้นิ้วเดียวกันที่ fret เดียวกัน -> เป็น barre
        const finger = barrePositions[0].finger!;
        const color = fingerColors[finger];

        // หาตำแหน่งสายที่ต้องวาดบาร์เรต
        const xPositions = barrePositions.map(p => p.stringPos.x + p.xOffset);
        const minX = Math.min(...xPositions);
        const maxX = Math.max(...xPositions);
        const centerX = (minX + maxX) / 2;
        const length = maxX - minX; // ความยาวของแถบ

        const avgY = barrePositions.reduce((sum, p) => sum + p.stringPos.y + p.yOffset, 0) / barrePositions.length;
        const avgZ = barrePositions[0].fretPos.z; // ใช้ fret เดียวกัน

        // สร้างแถบยาวแบบ rounded rectangle (แบนแต่หัวท้ายโค้ง)
        const barreWidth = 0.02; // ความกว้าง
        const cornerRadius = 0.01; // รัศมีมุมโค้ง
        
        // สร้าง shape แบบ rounded rectangle
        const shape = new THREE.Shape();
        const halfWidth = length / 2;
        const halfHeight = barreWidth / 2;
        
        // วาด rounded rectangle
        shape.moveTo(-halfWidth + cornerRadius, -halfHeight);
        shape.lineTo(halfWidth - cornerRadius, -halfHeight);
        shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + cornerRadius);
        shape.lineTo(halfWidth, halfHeight - cornerRadius);
        shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - cornerRadius, halfHeight);
        shape.lineTo(-halfWidth + cornerRadius, halfHeight);
        shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - cornerRadius);
        shape.lineTo(-halfWidth, -halfHeight + cornerRadius);
        shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + cornerRadius, -halfHeight);
        
        const extrudeSettings = {
          depth: 0.0001,
          bevelEnabled: true,
          bevelThickness: 0.0001,
          bevelSize: 0.007,
          bevelSegments: 2
        };
        
        const barreBar = new THREE.Mesh(
          new THREE.ExtrudeGeometry(shape, extrudeSettings),
          new THREE.MeshStandardMaterial({ color })
        );

        barreBar.position.set(
          centerX + modelOffset.x,
          avgY + modelOffset.y - 0.003,
          avgZ + modelOffset.z
        );
        
        // หมุนให้วางแบนบนคอ
        barreBar.rotation.set(-Math.PI / 2, 0, 0);
        
        markerGroup.add(barreBar);

        // ทำเครื่องหมายว่าใช้แล้ว
        barrePositions.forEach(pos => {
          const idx = positions.indexOf(pos);
          if (idx !== -1) usedPositions.add(idx);
        });
      }
    });

    // สร้างวงกลมสำหรับตำแหน่งที่ไม่ได้เป็น barre
    positions.forEach((pos, index) => {
      if (usedPositions.has(index)) return; // ข้ามตำแหน่งที่อยู่ใน barre แล้ว

      const color = pos.finger ? fingerColors[pos.finger] : "yellow";
      const marker = new THREE.Mesh(
        new THREE.CircleGeometry(0.02, 32),
        new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
      );

      marker.position.set(
        pos.stringPos.x + pos.xOffset + modelOffset.x,
        pos.stringPos.y + pos.yOffset + modelOffset.y,
        pos.fretPos.z + modelOffset.z
      );
      marker.rotation.x = -Math.PI / 2;
      markerGroup.add(marker);
    });

    scene.add(markerGroup);
  }, [highlightChord, scene]);

  const playSound = useCallback((meshName: string, stringNum: number, fret: number, skipTimeCheck = false) => {
    if (audioContext.state === "suspended") audioContext.resume();

    // ป้องกันการเล่นซ้ำเร็วเกิน 250ms ทั้ง click mode และ drag mode
    // ยกเว้นกรณี strum (skipTimeCheck = true)
    if (!skipTimeCheck) {
      const now = performance.now();
      if (lastPlayed.current?.meshName === meshName && now - lastPlayed.current.time < 250) return;
      lastPlayed.current = { meshName, time: now };
    }

    const buf = sounds[meshName];
    if (!buf) return; // ถ้าโหลดเสียงไม่ทัน ให้เงียบไปเลย

    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    src.connect(gainNode);
    gainNode.connect(audioContext.destination);
    src.start();

    // แสดงชื่อโน้ตบนหน้าจอ
    const noteName = getNoteName(stringNum, fret);
    onNotePlay(noteName);

    // ล้าง timeout เก่าถ้ามี (reset timer)
    if (noteDisplayTimeout.current) {
      clearTimeout(noteDisplayTimeout.current);
    }

    // ตั้ง timeout ใหม่สำหรับซ่อนชื่อโน้ตหลังจาก 2 วินาที
    noteDisplayTimeout.current = setTimeout(() => {
      onNotePlay("");
      noteDisplayTimeout.current = null;
    }, 2000);
  }, [audioContext, sounds, onNotePlay]);

  // ฟังก์ชัน strum - เล่นเสียงจากสาย 6 ถึงสาย 1
  const strumAllStrings = useCallback(async () => {
    if (isStrumming.current) return; // ป้องกันการ strum ซ้อนกัน
    isStrumming.current = true;

    // แมปสาย (1-6) กับ note name
    const stringToNote: Record<number, Note> = {
      6: "E6",
      5: "A",
      4: "D",
      3: "G",
      2: "B",
      1: "e1",
    };

    // เล่นเสียงแต่ละสายโดยมี delay 50ms ระหว่างแต่ละสาย
    for (let stringNum = 6; stringNum >= 1; stringNum--) {
      let fret = 0; // default เป็น open string

      // ถ้ามี highlightChord ให้ใช้ fret จากคอร์ด
      if (highlightChord) {
        const noteName = stringToNote[stringNum];
        if (noteName && highlightChord[noteName]) {
          fret = highlightChord[noteName].fret;
        }
      }

      const meshName = `String_${stringNum}_${fret}`;
      playSound(meshName, stringNum, fret, true); // skipTimeCheck = true
      await new Promise(resolve => setTimeout(resolve, 50)); // delay 50ms
    }

    isStrumming.current = false;
  }, [playSound, highlightChord]);

  // Event listener สำหรับ spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && canPlay) {
        e.preventDefault(); // ป้องกัน scroll หน้าเว็บ
        strumAllStrings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canPlay, strumAllStrings]);

  // คลิกบนสายที่ไม่ใช่ open string (fret > 0)
  const handleClick = (e: any) => {
    if (!canPlay) return;

    // เล่นเฉพาะ fret ที่ไม่ใช่ 0
    if (e.object && e.object.userData) {
      const userData = e.object.userData;
      if (userData.meshName && userData.stringNum && userData.fret !== undefined && userData.fret > 0) {
        playSound(userData.meshName, userData.stringNum, userData.fret);
      }
    }
  };

  // แมปสาย (1-6) กับ note name
  const stringToNote: Record<number, Note> = {
    6: "E6",
    5: "A",
    4: "D",
    3: "G",
    2: "B",
    1: "e1",
  };

  // ฟังก์ชันช่วยในการหา fret ที่ถูกต้องจากคอร์ด
  const getFretForString = (stringNum: number, currentFret: number): number => {
    // ถ้าไม่ใช่ open string (fret !== 0) ใช้ fret ปัจจุบัน
    if (currentFret !== 0) return currentFret;

    // ถ้าไม่มีคอร์ดที่เลือก ใช้ open string
    if (!highlightChord) return 0;

    // หา note name จากเลขสาย
    const noteName = stringToNote[stringNum];
    if (noteName && highlightChord[noteName]) {
      return highlightChord[noteName].fret;
    }

    return 0; // default เป็น open string
  };

  // ลากผ่าน open strings (fret 0)
  const handlePointerDown = (e: any) => {
    if (!canPlay) return;
    isDragging.current = true;

    // ตรวจสอบว่าเริ่มต้นที่ open string หรือไม่
    if (e.object && e.object.userData) {
      const userData = e.object.userData;
      if (userData.fret === 0 && userData.meshName && userData.stringNum !== undefined) {
        // หา fret ที่ถูกต้องจากคอร์ด
        const actualFret = getFretForString(userData.stringNum, userData.fret);
        const actualMeshName = `String_${userData.stringNum}_${actualFret}`;

        currentHitbox.current = userData.meshName; // จำ hitbox ปัจจุบัน
        playSound(actualMeshName, userData.stringNum, actualFret);
      }
    }
  };

  const handlePointerMove = (e: any) => {
    if (!canPlay || !isDragging.current) return;

    // ใช้ raycaster เพื่อหา mesh ที่เมาส์อยู่เหนือ
    raycaster.setFromCamera(e.pointer, e.camera);
    const intersects = raycaster.intersectObjects(stringMeshes.current);

    if (intersects.length > 0) {
      const userData = intersects[0].object.userData;
      // เล่นเสียงเฉพาะ open string (fret 0) เท่านั้น
      if (userData.fret === 0 && userData.meshName && userData.stringNum !== undefined) {
        // เล่นเสียงเฉพาะเมื่อเข้า hitbox ใหม่ที่ต่างจากเดิม
        if (currentHitbox.current !== userData.meshName) {
          currentHitbox.current = userData.meshName;

          // หา fret ที่ถูกต้องจากคอร์ด
          const actualFret = getFretForString(userData.stringNum, userData.fret);
          const actualMeshName = `String_${userData.stringNum}_${actualFret}`;

          playSound(actualMeshName, userData.stringNum, actualFret);
        }
      }
    } else {
      // เมื่อเมาส์ออกจาก hitbox ทั้งหมด ให้รีเซ็ต
      currentHitbox.current = null;
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    currentHitbox.current = null; // รีเซ็ตเมื่อปล่อยเมาส์
  };

  return (
    <primitive
      object={scene}
      position={[0.12, 0, -0.06]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}

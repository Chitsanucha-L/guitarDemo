import { useEffect, useMemo, useState, useRef } from "react";
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
  Am: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
  D: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 2, finger: 2 } },
  Dm: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 1, finger: 1 } },
  E: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } },
  Em: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } },
  A: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 2, finger: 4 }, e1: { fret: 0 } },
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
  const [isHoldingPick, setIsHoldingPick] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>("");

  return (
    <div className="w-full max-w-screen h-screen relative overflow-hidden bg-[#1a1a1a]">

      {/* ✅ ปุ่มเลือก Chord */}
      <div className="absolute top-5 left-5 z-10 flex gap-2 flex-wrap">
        {Object.keys(chords).map(chord => (
          <button
            key={chord}
            className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[18px] rounded-md shadow-md hover:opacity-80 transition"
            onClick={() => setHighlightChord(chords[chord])}
          >
            {chord}
          </button>
        ))}
        <button
          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-400 transition"
          onClick={() => setHighlightChord(null)}
        >
          Clear
        </button>
      </div>

      {/* ✅ ปุ่มถือปิ๊ก */}
      <div className="absolute top-18 left-5 z-10">
        <button
          onClick={() => setIsHoldingPick(!isHoldingPick)}
          className={`px-4 py-2 rounded-md transition font-medium text-[16px] ${isHoldingPick ? "bg-orange-500 text-white" : "bg-white text-black"}`}
        >
          {isHoldingPick ? "ถือปิ๊ก ✅" : "ไม่ถือปิ๊ก ❌"}
        </button>
      </div>

      {/* ✅ แสดงโน้ตที่กำลังเล่น */}
      {currentNote && (
        <div className="absolute top-5 right-5 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg shadow-xl">
          <div className="text-sm opacity-80">กำลังเล่น:</div>
          <div className="text-3xl font-bold">{currentNote}</div>
        </div>
      )}

      {/* ✅ Legend อธิบายสีแต่ละนิ้ว */}
      {highlightChord && (
        <div className="absolute bottom-5 left-5 z-10 bg-black bg-opacity-60 text-white p-3 rounded">
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
      <Canvas shadows camera={{ position: [0.3, 4, 0.01], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
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
  }, [audioContext, sounds]);

  // assign metadata ให้ mesh ทุกสายทุก fret
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
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
          
          meshes.push(child as THREE.Mesh);
        }
      }
    });
    stringMeshes.current = meshes;
  }, [scene]);

  // highlight marker
  useEffect(() => {
    const oldMarkers = scene.getObjectByName("HighlightMarkers");
    if (oldMarkers) scene.remove(oldMarkers);
    if (!highlightChord) return;

    const markerGroup = new THREE.Group();
    markerGroup.name = "HighlightMarkers";

    scene.traverse((child: THREE.Object3D) => {
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

      const color = chordNote.finger ? fingerColors[chordNote.finger] : "yellow";
      const marker = new THREE.Mesh(
        new THREE.CircleGeometry(0.02, 32),
        new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
      );

      let xOffset = 0;
      if (note === "E6") xOffset = 0.02;
      if (note === "A") xOffset = 0.01;
      if (note === "D") xOffset = 0.003;
      if (note === "G") xOffset = -0.004;
      if (note === "B") xOffset = -0.013;
      if (note === "e1") xOffset = -0.02;

      let yOffset = -0.008;
      if (note === "E6") yOffset = -0.002;

      marker.position.set(stringPos.x + xOffset, stringPos.y + yOffset, fretPos.z);
      marker.rotation.x = -Math.PI / 2;
      markerGroup.add(marker);
    });

    scene.add(markerGroup);
  }, [highlightChord, scene]);

  const playSound = (meshName: string, stringNum: number, fret: number) => {
    if (audioContext.state === "suspended") audioContext.resume();

    // กันกดซ้ำเร็วเกิน 250ms
    const now = performance.now();
    if (lastPlayed.current?.meshName === meshName && now - lastPlayed.current.time < 250) return;
    lastPlayed.current = { meshName, time: now };

    const buf = sounds[meshName];
    if (!buf) return; // ถ้าโหลดเสียงไม่ทัน ให้เงียบไปเลย

    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    src.connect(gainNode);
    gainNode.connect(audioContext.destination);
    src.start();

    console.log(meshName, stringNum, fret);

    // แสดงชื่อโน้ตบนหน้าจอ
    const noteName = getNoteName(stringNum, fret);
    onNotePlay(noteName);
    
    // ซ่อนชื่อโน้ตหลังจาก 1 วินาที
    setTimeout(() => onNotePlay(""), 1000);
  };

  // คลิกบนสายเพื่อเล่นเสียง
  const handleClick = (e: any) => {
    if (!canPlay) return;
    
    // ตรวจสอบว่าคลิกโดนสายหรือไม่
    if (e.object && e.object.userData) {
      const userData = e.object.userData;
      if (userData.meshName && userData.stringNum && userData.fret !== undefined) {
        playSound(userData.meshName, userData.stringNum, userData.fret);
      }
    }
  };

  return (
    <primitive
      object={scene}
      onClick={handleClick}
    />
  );
}

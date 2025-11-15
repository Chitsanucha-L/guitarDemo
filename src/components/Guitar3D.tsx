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
  String_E: "E6",
  String_A: "A",
  String_D: "D",
  String_G: "G",
  String_B: "B",
  String_e: "e1",
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
        <GuitarModel highlightChord={highlightChord} canPlay={isHoldingPick} />
        <OrbitControls enableDamping enableRotate={!isHoldingPick} />
      </Canvas>
    </div>
  );
}


function GuitarModel({ highlightChord, canPlay }: { highlightChord: Record<Note, { fret: number; finger?: Finger }> | null; canPlay: boolean }) {
  const { scene } = useGLTF("/models/guitar.glb") as any;
  const audioContext = useMemo(() => new (window.AudioContext || (window as any).webkitAudioContext)(), []);
  const sounds = useMemo<{ [key in Note]?: AudioBuffer }>(() => ({}), []);
  const volume = 0.3;

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const stringMeshes = useRef<THREE.Mesh[]>([]);
  const prevPointer = useRef<THREE.Vector3 | null>(null);
  const lastPlayed = useRef<{ note: Note; time: number } | null>(null);

  // โหลดเสียง
  useEffect(() => {
    const soundFiles: Record<Note, string> = {
      E6: "/sounds/E6.mp3",
      A: "/sounds/A.mp3",
      D: "/sounds/D.mp3",
      G: "/sounds/G.mp3",
      B: "/sounds/B.mp3",
      e1: "/sounds/e1.mp3",
    };
    async function loadSounds() {
      for (const note of Object.keys(soundFiles) as Note[]) {
        try {
          const res = await fetch(soundFiles[note]);
          const buf = await res.arrayBuffer();
          sounds[note] = await audioContext.decodeAudioData(buf);
        } catch (err) {
          console.warn(`Cannot load ${note}`, err);
        }
      }
    }
    loadSounds();
  }, [audioContext, sounds]);

  // assign note ให้ mesh
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh && meshToNote[child.name]) {
        (child as any).userData.note = meshToNote[child.name];
        meshes.push(child as THREE.Mesh);
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

  const playSound = (note: Note) => {
    if (audioContext.state === "suspended") audioContext.resume();

    // กันกดซ้ำสายเดียวกันเร็วเกิน 250ms
    const now = performance.now();
    if (lastPlayed.current?.note === note && now - lastPlayed.current.time < 250) return;
    lastPlayed.current = { note, time: now };

    const buf = sounds[note];
    if (!buf) return; // ถ้าโหลดเสียงไม่ทัน ให้เงียบไปเลย

    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    src.connect(gainNode);
    gainNode.connect(audioContext.destination);
    src.start();
  };

  // Raycaster + interpolation
  const handlePointerMove = (e: any) => {
    if (!canPlay || !prevPointer.current) return;
    const currentPointer = e.point.clone();
    const samples = 5;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const interp = new THREE.Vector3().lerpVectors(prevPointer.current, currentPointer, t);
      raycaster.set(interp, new THREE.Vector3(0, 0, -1));
      const intersects = raycaster.intersectObjects(stringMeshes.current);
      if (intersects.length) {
        const note: Note = intersects[0].object.userData.note;
        if (note) playSound(note);
      }
    }
    prevPointer.current = currentPointer;
  };

  return (
    <primitive
      object={scene}
      onPointerDown={(e: any) => {
        if (!canPlay) return;
        prevPointer.current = e.point.clone();
        handlePointerMove(e); // เล่นทันที
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { prevPointer.current = null; }}
    />
  );
}

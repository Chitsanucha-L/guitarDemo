import { useGLTF } from "@react-three/drei";
import type { ChordData } from "./data/types";
import { useGuitarCache } from "./hooks/useGuitarCache";
import { useChordAnimation } from "./hooks/useChordAnimation";
import { useGuitarAudio } from "./hooks/useGuitarAudio";
import { useGuitarInteraction } from "./hooks/useGuitarInteraction";

interface GuitarModelProps {
  highlightChord: ChordData | null;
  previousChord: ChordData | null;
  canPlay: boolean;
  onNotePlay: (note: string) => void;
  onStringPress?: (stringNum: number, fret: number) => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function GuitarModel({
  highlightChord,
  previousChord,
  canPlay,
  onNotePlay,
  onStringPress,
  position = [0.12, 0, -0.06],
  rotation = [0, 0.005, 0],
  scale = 1,
}: GuitarModelProps) {
  const { scene } = useGLTF("/models/guitar.glb") as any;

  // Use hooks
  const { stringMeshMap, fretMeshMap, stringMeshes } = useGuitarCache(scene);
  const { playSound, strumAllStrings } = useGuitarAudio(highlightChord, onNotePlay);
  const { handleClick, handlePointerDown, handlePointerMove, handlePointerUp } = useGuitarInteraction(
    canPlay,
    highlightChord,
    stringMeshes,
    playSound,
    strumAllStrings,
    onStringPress
  );

  useChordAnimation(scene, highlightChord, previousChord, stringMeshMap, fretMeshMap);

  return (
    <group 
      position={position}
      rotation={rotation}
      scale={scale}
    >
    <primitive
      object={scene}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
    </group>
  );
}

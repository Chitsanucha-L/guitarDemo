import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { useGLTF } from "@react-three/drei";
import type { ChordData } from "./data/types";
import { useGuitarCache } from "./hooks/useGuitarCache";
import { useChordAnimation } from "./hooks/useChordAnimation";
import { useScaleHighlight } from "./hooks/useScaleHighlight";
import { useGuitarAudio } from "./hooks/useGuitarAudio";
import { useGuitarInteraction } from "./hooks/useGuitarInteraction";

export type StrumDirectionFn = (direction: "down" | "up", delayMs?: number, subdivision?: number) => void;

interface GuitarModelProps {
  highlightChord: ChordData | null;
  chordRef: MutableRefObject<ChordData | null>;
  previousChord: ChordData | null;
  canPlay: boolean;
  onNotePlay: (note: string) => void;
  onStringPress?: (stringNum: number, fret: number) => void;
  onStrumReady?: (strumFn: StrumDirectionFn) => void;
  scaleNotes?: number[] | null;
  rootSemitone?: number | null;
  scaleFretRange?: [number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function GuitarModel({
  highlightChord,
  chordRef,
  previousChord,
  canPlay,
  onNotePlay,
  onStringPress,
  onStrumReady,
  scaleNotes = null,
  rootSemitone = null,
  scaleFretRange = [0, 12],
  position = [0.12, 0, -0.06],
  rotation = [0, 0.005, 0],
  scale = 1,
}: GuitarModelProps) {
  const { scene } = useGLTF("/models/guitar.glb") as any;

  const { stringFretMap, stringMeshes } = useGuitarCache(scene);
  const { playSound, strumAllStrings, strumDirection } = useGuitarAudio(highlightChord, onNotePlay, chordRef);

  useEffect(() => {
    if (onStrumReady) onStrumReady(strumDirection);
  }, [onStrumReady, strumDirection]);
  const { handleClick, handlePointerDown, handlePointerMove, handlePointerUp } = useGuitarInteraction(
    canPlay,
    highlightChord,
    stringMeshes,
    playSound,
    strumAllStrings,
    onStringPress
  );

  useChordAnimation(scene, highlightChord, previousChord, stringFretMap);
  useScaleHighlight(scene, scaleNotes, rootSemitone, stringFretMap, scaleFretRange);

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

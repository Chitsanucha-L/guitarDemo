import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { useGLTF } from "@react-three/drei";
import type { ChordData } from "./data/types";
import type { PressedPosition } from "./hooks/useChordGame";
import { useGuitarCache } from "./hooks/useGuitarCache";
import { useChordAnimation } from "./hooks/useChordAnimation";
import { useScaleHighlight } from "./hooks/useScaleHighlight";
import { useGuitarAudio } from "./hooks/useGuitarAudio";
import { useGuitarInteraction } from "./hooks/useGuitarInteraction";
import { usePlayerPressMarkers } from "./hooks/usePlayerPressMarkers";

export type StrumDirectionFn = (direction: "down" | "up", delayMs?: number, subdivision?: number) => void;

export interface StrumHandle {
  strumPositions: (positions: { stringNum: number; fret: number }[]) => Promise<void>;
}

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
  pressedPositions?: PressedPosition[];
  gameMode?: boolean;
  strumRef?: MutableRefObject<StrumHandle | null>;
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
  pressedPositions = [],
  gameMode = false,
  strumRef,
}: GuitarModelProps) {
  const { scene } = useGLTF("/models/guitar.glb") as any;

  const { stringFretMap, stringMeshes } = useGuitarCache(scene);
  const { playSound, strumAllStrings, strumDirection } = useGuitarAudio(highlightChord, onNotePlay, chordRef);

  useEffect(() => {
    if (onStrumReady) onStrumReady(strumDirection);
  }, [onStrumReady, strumDirection]);

  // Expose a strum function for arbitrary positions (used by game mode CHECK)
  useEffect(() => {
    if (!strumRef) return;
    strumRef.current = {
      strumPositions: async (positions) => {
        const order = [6, 5, 4, 3, 2, 1];
        for (const stringNum of order) {
          const pos = positions.find((p) => p.stringNum === stringNum);
          if (pos) {
            const meshName = `String_${stringNum}_${pos.fret}`;
            playSound(meshName, stringNum, pos.fret, true);
          }
          await new Promise((r) => setTimeout(r, 75));
        }
      },
    };
  }, [playSound, strumRef]);

  const { handleClick, handlePointerDown, handlePointerMove, handlePointerUp } = useGuitarInteraction(
    canPlay,
    highlightChord,
    stringMeshes,
    playSound,
    strumAllStrings,
    onStringPress,
    gameMode,
  );

  useChordAnimation(scene, highlightChord, previousChord, stringFretMap);
  useScaleHighlight(scene, scaleNotes, rootSemitone, stringFretMap, scaleFretRange);
  usePlayerPressMarkers(scene, pressedPositions);

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

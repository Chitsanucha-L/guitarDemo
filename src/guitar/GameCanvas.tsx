import { memo, useRef, useEffect } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, OrthographicCamera } from "@react-three/drei";
import GuitarModel from "./GuitarModel";
import type { StrumHandle, StrumDirectionFn } from "./GuitarModel";
import type { ChordData } from "./data/types";
import type { PressedPosition, PressedBarre, FeedbackMarker } from "./hooks/useChordGame";

interface GameCanvasProps {
  currentChord: ChordData | null;
  canPlay: boolean;
  onStringPress?: (stringNum: number, fret: number) => void;
  onBarrePress?: (strings: { stringNum: number; fret: number }[]) => void;
  pressedPositions?: PressedPosition[];
  pressedBarre?: PressedBarre | null;
  feedbackMarkers?: FeedbackMarker[];
  strumRef?: MutableRefObject<StrumHandle | null>;
  onStrumReady?: (strumFn: StrumDirectionFn) => void;
  isBelowLg?: boolean;
}

function FixedCamera({ isBelowLg }: { isBelowLg: boolean }) {
  const { size } = useThree();
  const worldHeight = isBelowLg ? 0.7 : 0.9;

  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, 10]}
      zoom={size.height / worldHeight}
      near={0.1}
      far={100}
    />
  );
}

function GameCanvas({ currentChord, canPlay, onStringPress, onBarrePress, pressedPositions = [], pressedBarre = null, feedbackMarkers = [], strumRef, onStrumReady, isBelowLg = false }: GameCanvasProps) {
  const previousChordRef = useRef<ChordData | null>(null);
  const chordRef = useRef<ChordData | null>(null);

  useEffect(() => {
    chordRef.current = currentChord;
    if (currentChord) {
      previousChordRef.current = currentChord;
    }
  }, [currentChord]);

  const isGameMode = pressedPositions.length > 0 || strumRef !== undefined;

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas shadows>
        <FixedCamera isBelowLg={isBelowLg} />

        <Environment preset="apartment" />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        <GuitarModel
          position={isBelowLg ? [-0.8, -0.04, 0] : [-0.8, 0, 0]}
          rotation={[Math.PI / 2, -Math.PI / 2 + 0.01, 0]}
          highlightChord={isGameMode ? null : currentChord}
          chordRef={chordRef}
          previousChord={isGameMode ? null : previousChordRef.current}
          canPlay={canPlay}
          onNotePlay={() => { }}
          onStringPress={onStringPress}
          onBarrePress={onBarrePress}
          onStrumReady={onStrumReady}
          pressedPositions={pressedPositions}
          pressedBarre={pressedBarre}
          feedbackMarkers={feedbackMarkers}
          gameMode={isGameMode}
          strumRef={strumRef}
        />

        <OrbitControls
          enabled={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}

export default memo(GameCanvas, (prev, next) => {
  return (
    prev.currentChord === next.currentChord &&
    prev.canPlay === next.canPlay &&
    prev.onStringPress === next.onStringPress &&
    prev.onBarrePress === next.onBarrePress &&
    prev.pressedPositions === next.pressedPositions &&
    prev.pressedBarre === next.pressedBarre &&
    prev.feedbackMarkers === next.feedbackMarkers &&
    prev.strumRef === next.strumRef &&
    prev.onStrumReady === next.onStrumReady &&
    prev.isBelowLg === next.isBelowLg
  );
});

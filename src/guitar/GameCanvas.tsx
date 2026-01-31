import { memo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import GuitarModel from "./GuitarModel";
import type { ChordData } from "./data/types";
import { OrthographicCamera } from "@react-three/drei";

interface GameCanvasProps {
  currentChord: ChordData | null;
  canPlay: boolean;
  onStringPress?: (stringNum: number, fret: number) => void;
}

/**
 * Isolated Canvas component that prevents re-renders from game state changes.
 * This component is memoized and only updates when chord or interaction props change.
 */
function FixedCamera() {
  const { size } = useThree();

  /**
   * worldHeight = สิ่งที่คุณอยากเห็น “สูงเท่าเดิมเสมอ”
   * ปรับค่านี้ครั้งเดียว → ทุกจอเหมือนกัน
   */
  const worldHeight = 1.9;

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


function GameCanvas({ currentChord, canPlay, onStringPress }: GameCanvasProps) {
  const previousChordRef = useRef<ChordData | null>(null);

  useEffect(() => {
    if (currentChord) {
      previousChordRef.current = currentChord;
    }
  }, [currentChord]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas shadows>
        {/* ✅ FIXED ORTHOGRAPHIC CAMERA */}
        <FixedCamera />

        <Environment preset="apartment" />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        <GuitarModel
          position={[-0.3, 0, 0]}
          rotation={[Math.PI / 2, -Math.PI / 2 + 0.01, 0]}
          highlightChord={currentChord}
          previousChord={previousChordRef.current}
          canPlay={canPlay}
          onNotePlay={() => {}}
          onStringPress={onStringPress}
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

// Memoize to prevent unnecessary re-renders
export default memo(GameCanvas, (prev, next) => {
  return (
    prev.currentChord === next.currentChord &&
    prev.canPlay === next.canPlay &&
    prev.onStringPress === next.onStringPress
  );
});

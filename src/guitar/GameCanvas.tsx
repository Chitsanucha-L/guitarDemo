import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import type { MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, OrthographicCamera } from "@react-three/drei";
import GuitarModel from "./GuitarModel";
import type { StrumHandle, StrumDirectionFn } from "./GuitarModel";
import type { ChordData } from "./data/types";
import type { PressedPosition, PressedBarre, FeedbackMarker } from "./hooks/useChordGame";

const WORLD_HEIGHT_STORAGE_KEY = "guitar-game-canvas-world-height-offset";
const WORLD_HEIGHT_STEP = 0.06;
const WORLD_HEIGHT_MIN = 0.55;
const WORLD_HEIGHT_MAX = 2.2;

function readWorldHeightOffset(): number {
  try {
    const v = localStorage.getItem(WORLD_HEIGHT_STORAGE_KEY);
    if (v == null) return 0;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

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

function FixedCamera({ worldHeight }: { worldHeight: number }) {
  const { size } = useThree();

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

function GameCanvas({
  currentChord,
  canPlay,
  onStringPress,
  onBarrePress,
  pressedPositions = [],
  pressedBarre = null,
  feedbackMarkers = [],
  strumRef,
  onStrumReady,
  isBelowLg = false,
}: GameCanvasProps) {
  const { t } = useTranslation();
  const previousChordRef = useRef<ChordData | null>(null);
  const chordRef = useRef<ChordData | null>(null);

  const baseWorldHeight = isBelowLg ? 0.95 : 1.1;
  const [heightOffset, setHeightOffset] = useState(readWorldHeightOffset);

  useEffect(() => {
    try {
      localStorage.setItem(WORLD_HEIGHT_STORAGE_KEY, String(heightOffset));
    } catch {
      /* ignore */
    }
  }, [heightOffset]);

  const worldHeight = useMemo(
    () =>
      Math.min(
        WORLD_HEIGHT_MAX,
        Math.max(WORLD_HEIGHT_MIN, baseWorldHeight + heightOffset),
      ),
    [baseWorldHeight, heightOffset],
  );

  const atMin = worldHeight <= WORLD_HEIGHT_MIN + 1e-6;
  const atMax = worldHeight >= WORLD_HEIGHT_MAX - 1e-6;

  const bumpUp = useCallback(() => {
    setHeightOffset((o) => o + WORLD_HEIGHT_STEP);
  }, []);

  const bumpDown = useCallback(() => {
    setHeightOffset((o) => o - WORLD_HEIGHT_STEP);
  }, []);

  const resetHeight = useCallback(() => {
    setHeightOffset(0);
    try {
      localStorage.removeItem(WORLD_HEIGHT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

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
        <FixedCamera worldHeight={worldHeight} />

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

      {/* View height — stored in localStorage (responsive touch targets + spacing) */}
      <div
        className="absolute z-30 flex flex-row items-stretch gap-1.5 pointer-events-auto
          bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))]
          lg:bottom-6 lg:right-6 lg:gap-2.5"
        role="group"
        aria-label={t("game.canvasViewControls")}
      >
        <button
          type="button"
          onClick={bumpUp}
          disabled={atMax}
          title={t("game.canvasZoomOut")}
          className="inline-flex items-center justify-center min-h-[32px] min-w-[32px] w-[32px] shrink-0
            lg:min-h-[44px] lg:min-w-[44px] lg:w-[44px]
            rounded-lg
            bg-gray-900/90 border border-gray-600/70 sm:border-gray-500/60
            text-gray-100 text-sm lg:text-xl font-bold
            shadow-lg backdrop-blur-sm
            hover:bg-gray-800 md:hover:border-gray-400/50
            disabled:opacity-35 disabled:cursor-not-allowed
            active:scale-95 transition touch-manipulation"
        >
          +
        </button>
        <button
          type="button"
          onClick={bumpDown}
          disabled={atMin}
          title={t("game.canvasZoomIn")}
          className="inline-flex items-center justify-center min-h-[32px] min-w-[32px] w-[32px] shrink-0
            lg:min-h-[44px] lg:min-w-[44px] lg:w-[44px]
            rounded-lg
            bg-gray-900/90 border border-gray-600/70 sm:border-gray-500/60
            text-gray-100 text-sm lg:text-xl font-bold
            shadow-lg backdrop-blur-sm
            hover:bg-gray-800 md:hover:border-gray-400/50
            disabled:opacity-35 disabled:cursor-not-allowed
            active:scale-95 transition touch-manipulation"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetHeight}
          title={t("game.canvasResetView")}
          className="inline-flex items-center justify-center min-h-[32px] min-w-[32px] w-[32px] shrink-0 px-1
            lg:min-h-[44px] lg:min-w-[44px] lg:w-[44px]
            rounded-lg
            bg-gray-800/95 border border-gray-600/60 sm:border-gray-500/50
            text-[10px] lg:text-[12px] text-gray-300 leading-tight text-center
            shadow-md backdrop-blur-sm
            hover:bg-gray-700 md:hover:border-gray-400/40
            active:scale-95 transition touch-manipulation"
        >
          {t("game.canvasResetButton")}
        </button>
      </div>
    </div>
  );
}

export default GameCanvas;

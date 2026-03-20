import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useTranslation } from "react-i18next";
import type { ChordData } from "./data/types";
import type { ChordVoicing } from "./data/chordLibrary";
import { resolveChordByName } from "./data/chordLibrary";
import GuitarModel from "./GuitarModel";
import type { StrumDirectionFn } from "./GuitarModel";
import ChordSelector from "./ui/ChordSelector";
import PickToggle from "./ui/PickToggle";
import CurrentNoteDisplay from "./ui/CurrentNoteDisplay";
import ChordDiagram from "./ui/ChordDiagram";
import FingerLegend from "./ui/FingerLegend";
import StrumPanel from "./ui/StrumPanel";
import type { StrumPanelHandle } from "./ui/StrumPanel";
import ScaleSelector from "./ui/ScaleSelector";
import BottomSheet from "./ui/BottomSheet";
import ChordBuilderSheet from "./ui/ChordBuilderSheet";
import MobileNav from "./ui/MobileNav";
import MobileBottomTabs, { type MobileBottomTab } from "./ui/MobileBottomTabs";
import ProgressionPanel from "./ui/ProgressionPanel";
import { useChordProgression } from "./hooks/useChordProgression";
import type { ChordProgression } from "./data/chordProgressions";
import type { Root } from "./types/chord";
import type { Stroke } from "./hooks/useStrummingEngine";

type PanelId = "chord" | "strum" | "progression" | "scale";

const DEFAULT_POSITION = new THREE.Vector3(0.3, 6, 0.01);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);
const DEFAULT_SPHERICAL = new THREE.Spherical().setFromVector3(
  new THREE.Vector3().subVectors(DEFAULT_POSITION, DEFAULT_TARGET),
);
const LERP_SPEED = 3.5;

function CameraController({ isPlayMode }: { isPlayMode: boolean }) {
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const { camera } = useThree();
  const animating = useRef(false);
  const wasPlayMode = useRef(isPlayMode);

  useEffect(() => {
    if (isPlayMode && !wasPlayMode.current) {
      animating.current = true;
    }
    wasPlayMode.current = isPlayMode;
  }, [isPlayMode]);

  useFrame((_, delta) => {
    if (!animating.current || !controlsRef.current) return;

    const controls = controlsRef.current;
    const t = Math.min(LERP_SPEED * delta, 1);

    // Lerp the orbit target
    controls.target.lerp(DEFAULT_TARGET, t);

    // Animate in spherical coordinates so the camera orbits smoothly
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const current = new THREE.Spherical().setFromVector3(offset);

    // Shortest-path for the horizontal angle (avoids spinning the long way)
    let dTheta = DEFAULT_SPHERICAL.theta - current.theta;
    if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
    if (dTheta < -Math.PI) dTheta += 2 * Math.PI;

    current.radius += (DEFAULT_SPHERICAL.radius - current.radius) * t;
    current.phi += (DEFAULT_SPHERICAL.phi - current.phi) * t;
    current.theta += dTheta * t;

    camera.position.copy(controls.target).add(
      new THREE.Vector3().setFromSpherical(current),
    );
    controls.update();

    // Snap when close enough
    const posDist = camera.position.distanceTo(DEFAULT_POSITION);
    const tgtDist = controls.target.distanceTo(DEFAULT_TARGET);
    if (posDist < 0.01 && tgtDist < 0.01) {
      camera.position.copy(DEFAULT_POSITION);
      controls.target.copy(DEFAULT_TARGET);
      controls.update();
      animating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      enableRotate={!isPlayMode}
    />
  );
}

function SectionHeader({
  label,
  icon,
  isOpen,
  onToggle,
}: {
  label: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-800/90 transition group"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider group-hover:text-white transition">
          {label}
        </span>
      </div>
      <span className={`text-gray-500 text-[10px] transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}>
        ▼
      </span>
    </button>
  );
}

export default function Guitar3D() {
  const { t } = useTranslation();
  const [highlightChord, setHighlightChord] = useState<ChordData | null>(null);
  const [selectedChordName, setSelectedChordName] = useState<string | null>(null);
  const [isHoldingPick, setIsHoldingPick] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>("");
  const previousChordRef = useRef<ChordData | null>(null);
  const chordRef = useRef<ChordData | null>(null);
  const strumFnRef = useRef<StrumDirectionFn | null>(null);
  const strumPanelRef = useRef<StrumPanelHandle>(null);
  const [strumPlaying, setStrumPlaying] = useState(false);

  const [openPanels, setOpenPanels] = useState<Set<PanelId>>(new Set(["chord"]));

  const [activeMobileTab, setActiveMobileTab] = useState<MobileBottomTab>("play");

  const [tabBarHeight, setTabBarHeight] = useState(40);
  const [navHeight, setNavHeight] = useState(56);
  useEffect(() => {
    const measure = () => {
      const tabs = document.querySelector("[data-mobile-bottom-tabs]");
      if (tabs) setTabBarHeight(tabs.getBoundingClientRect().height);
      const nav = document.querySelector("[data-mobile-nav]");
      if (nav) setNavHeight(nav.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);
  const mobileSheetBottomOffsetPx = tabBarHeight;

  useEffect(() => {
    chordRef.current = highlightChord;
  }, [highlightChord]);

  const [chordRoot, setChordRoot] = useState<Root>("C");
  const [scaleNotes, setScaleNotes] = useState<number[] | null>(null);
  const [rootSemitone, setRootSemitone] = useState<number | null>(null);
  const [scaleFretRange, setScaleFretRange] = useState<[number, number]>([0, 12]);

  const [activeProgression, setActiveProgression] = useState<ChordProgression | null>(null);
  const progression = useChordProgression(activeProgression?.chords ?? ["C"]);
  const [progressionResetToken, setProgressionResetToken] = useState(0);

  const togglePanel = useCallback((id: PanelId) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const applyChord = useCallback((name: string) => {
    const chord = resolveChordByName(name);
    previousChordRef.current = highlightChord;
    chordRef.current = chord;
    setHighlightChord(chord);
    setSelectedChordName(name);
    setScaleNotes(null);
    setRootSemitone(null);
  }, [highlightChord]);

  const handleChordSelect = (chordName: string, voicing?: ChordVoicing) => {
    const newChord = voicing ? voicing.data : resolveChordByName(chordName);
    previousChordRef.current = highlightChord;
    chordRef.current = newChord;
    setHighlightChord(newChord);
    setSelectedChordName(chordName);
    setScaleNotes(null);
    setRootSemitone(null);
  };

  const handleClearChord = () => {
    previousChordRef.current = highlightChord;
    chordRef.current = null;
    setHighlightChord(null);
    setSelectedChordName(null);
  };

  const handleRootChange = useCallback((root: Root) => {
    setChordRoot(root);
  }, []);

  const handleStrumReady = useCallback((fn: StrumDirectionFn) => {
    strumFnRef.current = fn;
  }, []);

  const handleStroke = useCallback((stroke: Stroke, subdivision: number) => {
    if (strumFnRef.current) {
      strumFnRef.current(stroke === "down" ? "down" : "up", 30, subdivision);
    }
  }, []);

  const handlePlayChord = useCallback(() => {
    strumFnRef.current?.("down", 30);
  }, []);

  const handleBarChange = useCallback(() => {
    if (!activeProgression) return;
    const nextChord = progression.advance();
    if (nextChord) {
      applyChord(nextChord);
    }
  }, [activeProgression, progression, applyChord]);

  const handleProgressionSelect = useCallback((prog: ChordProgression | null) => {
    setActiveProgression(prog);
    if (prog) {
      // Selecting a progression disables Scale mode.
      setScaleNotes(null);
      setRootSemitone(null);
      setScaleFretRange([0, 12]);

      progression.reset();
      applyChord(prog.chords[0]);
    }
  }, [progression, applyChord]);

  const handleScaleChange = useCallback(
    (notes: number[] | null, root: number | null, fretRange: [number, number]) => {
      if (notes) {
        // Selecting a scale disables Progression mode.
        setActiveProgression(null);
        progression.reset();
        setProgressionResetToken((t) => t + 1);

        previousChordRef.current = highlightChord;
        chordRef.current = null;
        setHighlightChord(null);
        setSelectedChordName(null);
      }
      setScaleNotes(notes);
      setRootSemitone(root);
      setScaleFretRange(fretRange);
    },
    [highlightChord, progression],
  );

  return (
    <div className="w-full max-w-screen min-h-screen min-h-dvh h-screen h-dvh relative overflow-hidden bg-[#1a1a1a]">

      {/* Mobile: top nav + fixed CTA + bottom tabs + bottom sheet */}
      <div className="xl:hidden">
        <MobileNav
          chordName={selectedChordName}
          rightModeLabel={isHoldingPick ? t("pick.playMode") : t("pick.viewMode")}
          rightModeActive={isHoldingPick}
          onRightModeToggle={() => setIsHoldingPick((p) => !p)}
        />

        <MobileBottomTabs
          activeTab={activeMobileTab}
          onTabChange={setActiveMobileTab}
        />

        <BottomSheet
          defaultSnap="half"
          bottomOffsetPx={mobileSheetBottomOffsetPx}
          topOffsetPx={navHeight}
          handle={
            <div className="w-16 flex items-center justify-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-500/80" aria-hidden />
            </div>
          }
        >
          <div className="relative px-3 pb-3 pt-4">
            {/* Strum tab still has its own top-right CTA; Play button moved into the chord row below */}

            {/* Strum Play/Stop (top-right of bottom sheet) */}
            {activeMobileTab === "strum" && (
              <button
                type="button"
                onClick={() => strumPanelRef.current?.toggle()}
                className={`absolute right-3 top-1 z-10 h-[30px] min-h-[30px] px-3 rounded-2xl text-white text-xs font-bold shadow-xl active:scale-[0.99] transition-all touch-manipulation ${
                  strumPlaying
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : "bg-gradient-to-r from-green-500 to-emerald-600"
                }`}
              >
                {strumPlaying ? "⏹ Stop" : "▶ Play"}
              </button>
            )}

            <div className={activeMobileTab === "play" ? "" : "hidden"}>
              <ChordBuilderSheet
                selectedChordName={selectedChordName}
                onSelect={handleChordSelect}
                onClear={handleClearChord}
                onRootChange={handleRootChange}
              />

              {highlightChord && selectedChordName && (
                <div className="mt-3 border-t border-gray-700/40 pt-3 flex flex-col min-[420px]:flex-row gap-3 items-start min-[420px]:items-center">
                  <div className="shrink-0 w-[120px]">
                    <ChordDiagram chordName={selectedChordName} chordData={highlightChord} compact />
                  </div>
                  <div className="flex-1 min-w-0 min-[420px]:self-center">
                    <FingerLegend highlightChord={highlightChord} inline />
                  </div>
                  <button
                    type="button"
                    onClick={handlePlayChord}
                    disabled={!highlightChord}
                    className="shrink-0 self-center h-[34px] min-h-[34px] px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-xl active:scale-[0.97] transition-transform touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ▶ Play
                  </button>
                </div>
              )}
            </div>

            <div className={activeMobileTab === "strum" ? "" : "hidden"}>
              <StrumPanel
                ref={strumPanelRef}
                onStroke={handleStroke}
                onBarChange={handleBarChange}
                hidePlayButton
                onPlayingChange={setStrumPlaying}
              />
            </div>

            <div className={activeMobileTab === "progression" ? "" : "hidden"}>
              <ProgressionPanel
                active={!!activeProgression}
                currentIndex={progression.index}
                onSelect={handleProgressionSelect}
                resetToken={progressionResetToken}
              />
            </div>

            <div className={activeMobileTab === "scale" ? "" : "hidden"}>
              <ScaleSelector root={chordRoot} scaleNotes={scaleNotes} onScaleChange={handleScaleChange} />
            </div>
          </div>
        </BottomSheet>
      </div>

      {/* Left sidebar — desktop only */}
      <div className="absolute top-12 lg:top-18 left-2 lg:left-4 z-50 pointer-events-auto hidden xl:block">
        <div
          className="w-56 lg:w-80 max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-5rem)] overflow-y-auto pr-1 space-y-2 pb-10"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#4b5563 transparent" }}
        >
          {/* Pick toggle — always visible */}
          <PickToggle
            isHoldingPick={isHoldingPick}
            onToggle={() => setIsHoldingPick(!isHoldingPick)}
          />

          {/* ── CHORD BUILDER ── */}
          <div className="mt-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold px-1 mb-1.5">{t("sections.chordBuilder")}</p>
            <div className="bg-gray-900/80 rounded-xl backdrop-blur-sm overflow-hidden">
              <SectionHeader
                label={t("sections.chordBuilder")}
                icon="🎸"
                isOpen={openPanels.has("chord")}
                onToggle={() => togglePanel("chord")}
              />
              <div className="px-3 pb-3 pt-1" style={{ display: openPanels.has("chord") ? undefined : "none" }}>
                <ChordSelector
                  selectedChordName={selectedChordName}
                  onSelect={handleChordSelect}
                  onClear={handleClearChord}
                  onRootChange={handleRootChange}
                />
              </div>
            </div>
          </div>

          {/* ── PLAY ── */}
          <div className="mt-4 border-t border-t-2 border-gray-700/40 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold px-1 mb-1.5">{t("sections.play")}</p>
            <div className="space-y-2">
              <div className="bg-gray-900/80 rounded-xl backdrop-blur-sm overflow-hidden">
                <SectionHeader
                  label={t("sections.strumming")}
                  icon="🎵"
                  isOpen={openPanels.has("strum")}
                  onToggle={() => togglePanel("strum")}
                />
                <div className="px-3 pb-3 pt-1" style={{ display: openPanels.has("strum") ? undefined : "none" }}>
                  <StrumPanel onStroke={handleStroke} onBarChange={handleBarChange} />
                </div>
              </div>

              <div className="bg-gray-900/80 rounded-xl backdrop-blur-sm overflow-hidden">
                <SectionHeader
                  label={t("sections.progression")}
                  icon="🔄"
                  isOpen={openPanels.has("progression")}
                  onToggle={() => togglePanel("progression")}
                />
                <div className="px-3 pb-3 pt-1" style={{ display: openPanels.has("progression") ? undefined : "none" }}>
                  <ProgressionPanel
                    active={!!activeProgression}
                    currentIndex={progression.index}
                    onSelect={handleProgressionSelect}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── THEORY ── */}
          <div className="mt-4 border-t border-t-2 border-gray-700/40 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold px-1 mb-1.5">{t("sections.theory")}</p>
            <div className="bg-gray-900/80 rounded-xl backdrop-blur-sm overflow-hidden">
              <SectionHeader
                label={t("sections.scale")}
                icon="🎹"
                isOpen={openPanels.has("scale")}
                onToggle={() => togglePanel("scale")}
              />
              <div className="px-3 pb-3 pt-1" style={{ display: openPanels.has("scale") ? undefined : "none" }}>
                <ScaleSelector root={chordRoot} scaleNotes={scaleNotes} onScaleChange={handleScaleChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top center — Now Playing (desktop only; mobile uses ChordBadge) */}
      <div className="absolute top-12 lg:top-18 left-1/2 -translate-x-1/2 z-50 hidden xl:block">
        <CurrentNoteDisplay currentNote={currentNote} chordName={selectedChordName} />
      </div>

      {/* Right side — Chord Diagram (desktop only) */}
      {highlightChord && selectedChordName && (
        <div className="absolute top-12 lg:top-18 right-2 lg:right-5 z-50 hidden xl:block">
          <ChordDiagram chordName={selectedChordName} chordData={highlightChord} />
        </div>
      )}

      {/* Finger legend (desktop only) */}
      <div className="hidden xl:block">
        <FingerLegend highlightChord={highlightChord} />
      </div>

      <Canvas shadows camera={{ position: [0.3, 6, 0.01], fov: 30 }} gl={{ preserveDrawingBuffer: true }} className="pointer-events-auto">
        <Suspense fallback={null}>
          <Environment preset="apartment" />
          <GuitarModel
            rotation={[0, -0.015, 0]}
            highlightChord={scaleNotes ? null : highlightChord}
            chordRef={chordRef}
            previousChord={previousChordRef.current}
            canPlay={isHoldingPick}
            onNotePlay={setCurrentNote}
            onStrumReady={handleStrumReady}
            scaleNotes={highlightChord ? null : scaleNotes}
            rootSemitone={highlightChord ? null : rootSemitone}
            scaleFretRange={scaleFretRange}
          />
        </Suspense>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <CameraController isPlayMode={isHoldingPick} />
      </Canvas>
    </div>
  );
}

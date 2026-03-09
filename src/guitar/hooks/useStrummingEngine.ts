import { useRef, useCallback, useState, useEffect, useMemo } from "react";

export type Stroke = "down" | "up";

export interface PatternStep {
  stroke: Stroke;
  subdivision: number; // 0-15 within a bar (1 e & a  2 e & a  3 e & a  4 e & a)
}

export interface StrumPattern {
  id: string;
  label: string;
  steps: PatternStep[];
  /** Recommended BPM for this pattern; applied when the pattern is selected */
  recommendedBpm?: number;
}

export const SUBDIVISIONS_PER_BAR = 16;

export const PRESET_PATTERNS: StrumPattern[] = [
  {
    id: "basic-4",
    label: "Basic 4/4",
    recommendedBpm: 80,
    steps: [
      { stroke: "down", subdivision: 0 },
      { stroke: "down", subdivision: 4 },
      { stroke: "down", subdivision: 8 },
      { stroke: "down", subdivision: 12 },
    ],
  },
  {
    id: "basic-1",
    label: "Basic 1/4",
    recommendedBpm: 110,
    steps: [
      { stroke: "down", subdivision: 0 },
      { stroke: "down", subdivision: 4 },
      { stroke: "up", subdivision: 7 },
      { stroke: "up", subdivision: 11 },
      { stroke: "down", subdivision: 12 },
    ],
  },
  {
    id: "folk",
    label: "Folk",
    recommendedBpm: 65,
    steps: [
      { stroke: "down", subdivision: 0 },
      { stroke: "down", subdivision: 4 },
      { stroke: "up", subdivision: 7 },
      { stroke: "up", subdivision: 9 },
      { stroke: "down", subdivision: 10 },
      { stroke: "down", subdivision: 12 },
    ],
  },
];

const JITTER_MS = 8;
const SWING_AMOUNT = 0.08; // fraction of a 16th-note to delay off-beats
const VELOCITY_HUMANIZE = 0.1; // ±10% randomness

interface StrummingEngineOptions {
  pattern: StrumPattern;
  bpm: number;
  onStroke: (stroke: Stroke, subdivision: number, velocity: number) => void;
  onBarChange?: () => void;
}

/**
 * Base velocity by stroke and position in bar.
 * Downstrokes are heavier; subdivision 0 is the strongest accent.
 */
function getBaseVelocity(stroke: Stroke, subdivision: number): number {
  const isFirstBeat = subdivision === 0;
  const isDownbeat = subdivision % 4 === 0; // 0, 4, 8, 12

  if (stroke === "down") {
    if (isFirstBeat) return 0.95;
    if (isDownbeat) return 0.88;
    return 0.82;
  }
  // upstroke
  if (isFirstBeat) return 0.75;
  if (isDownbeat) return 0.62;
  return 0.55;
}

/**
 * Apply ±10% humanization and clamp to [0, 1].
 */
function humanizeVelocity(base: number): number {
  const factor = 1 + (Math.random() - 0.5) * 2 * VELOCITY_HUMANIZE;
  return Math.min(1, Math.max(0, base * factor));
}

/**
 * Micro-delay in ms for this subdivision: swing (off-beats late) + jitter.
 */
function getStrokeDelayMs(subdivision: number, subdivDurationMs: number): number {
  const isOffBeat = subdivision % 2 === 1;
  const swingMs = isOffBeat ? subdivDurationMs * SWING_AMOUNT : 0;
  const jitterMs = (Math.random() - 0.5) * 2 * JITTER_MS;
  return Math.max(0, swingMs + jitterMs);
}

export function useStrummingEngine({ pattern, bpm, onStroke, onBarChange }: StrummingEngineOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);

  const isPlayingRef = useRef(false);
  const rafRef = useRef<number>(0);
  const subdivisionRef = useRef(-1);
  const barStartTimeRef = useRef(0);
  const barIdRef = useRef(0);
  const onStrokeRef = useRef(onStroke);
  const onBarChangeRef = useRef(onBarChange);
  const bpmRef = useRef(bpm);

  const stepMap = useMemo(() => {
    const map = new Map<number, PatternStep>();
    for (const step of pattern.steps) {
      map.set(step.subdivision, step);
    }
    return map;
  }, [pattern]);

  const stepMapRef = useRef(stepMap);

  useEffect(() => { onStrokeRef.current = onStroke; }, [onStroke]);
  useEffect(() => { onBarChangeRef.current = onBarChange; }, [onBarChange]);
  useEffect(() => { stepMapRef.current = stepMap; }, [stepMap]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const tick = useCallback((timestamp: number) => {
    if (!isPlayingRef.current) return;

    const beatDuration = (60 / bpmRef.current) * 1000;
    const subdivDuration = beatDuration / 4;
    const barDuration = subdivDuration * SUBDIVISIONS_PER_BAR;

    let elapsed = timestamp - barStartTimeRef.current;

    while (elapsed >= barDuration) {
      barStartTimeRef.current += barDuration;
      elapsed = timestamp - barStartTimeRef.current;
      subdivisionRef.current = -1;
      barIdRef.current++;
      onBarChangeRef.current?.();
    }

    // Use strict grid position (no swing in elapsed) so RAF stays in sync
    const subdivision = Math.floor(elapsed / subdivDuration) % SUBDIVISIONS_PER_BAR;

    if (subdivision !== subdivisionRef.current) {
      subdivisionRef.current = subdivision;

      const step = stepMapRef.current.get(subdivision);
      if (step) {
        const baseVelocity = getBaseVelocity(step.stroke, subdivision);
        const velocity = humanizeVelocity(baseVelocity);

        const delayMs = getStrokeDelayMs(subdivision, subdivDuration);
        const barId = barIdRef.current;
        const capturedSubdivision = subdivision;

        setTimeout(() => {
          if (isPlayingRef.current && barId === barIdRef.current) {
            onStrokeRef.current(step.stroke, capturedSubdivision, velocity);
          }
        }, delayMs);
      }
      setCurrentBeat(subdivision);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    subdivisionRef.current = -1;
    barIdRef.current = 0;
    barStartTimeRef.current = performance.now();
    setIsPlaying(true);
    setCurrentBeat(-1);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setCurrentBeat(-1);
    subdivisionRef.current = -1;
    barIdRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { isPlaying, currentBeat, play, stop };
}

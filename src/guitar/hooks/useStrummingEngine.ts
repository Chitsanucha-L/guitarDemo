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
}

export const SUBDIVISIONS_PER_BAR = 16;

export const PRESET_PATTERNS: StrumPattern[] = [
  {
    id: "basic-4",
    label: "Basic 4/4",
    steps: [
      { stroke: "down", subdivision: 0 },
      { stroke: "down", subdivision: 4 },
      { stroke: "down", subdivision: 8 },
      { stroke: "down", subdivision: 12 },
    ],
  },
  // {
  //   id: "folk",
  //   label: "Folk",
  //   steps: [
  //     { stroke: "down", subdivision: 0 },
  //     { stroke: "down", subdivision: 4 },
  //     { stroke: "up",   subdivision: 6 },
  //     { stroke: "up",   subdivision: 8 },
  //     { stroke: "down", subdivision: 12 },
  //     { stroke: "up",   subdivision: 14 },
  //   ],
  // },
  // {
  //   id: "pop",
  //   label: "Pop",
  //   steps: [
  //     { stroke: "down", subdivision: 0 },
  //     { stroke: "up",   subdivision: 2 },
  //     { stroke: "down", subdivision: 8 },
  //     { stroke: "up",   subdivision: 10 },
  //   ],
  // },
  // {
  //   id: "island",
  //   label: "Island",
  //   steps: [
  //     { stroke: "down", subdivision: 0 },
  //     { stroke: "down", subdivision: 2 },
  //     { stroke: "up",   subdivision: 4 },
  //     { stroke: "up",   subdivision: 6 },
  //     { stroke: "down", subdivision: 8 },
  //     { stroke: "up",   subdivision: 10 },
  //     { stroke: "down", subdivision: 12 },
  //     { stroke: "up",   subdivision: 14 },
  //   ],
  // },
];

const HUMANIZE_MS = 12;
const SWING_AMOUNT = 0.08;

interface StrummingEngineOptions {
  pattern: StrumPattern;
  bpm: number;
  onStroke: (stroke: Stroke, subdivision: number, velocity: number) => void;
  onBarChange?: () => void;
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

    const rawSubdiv = Math.floor(elapsed / subdivDuration);
    const swingOffset = rawSubdiv % 2 === 1
      ? subdivDuration * SWING_AMOUNT
      : 0;

    const adjustedElapsed = Math.max(0, elapsed - swingOffset);
    const subdivision = Math.floor(adjustedElapsed / subdivDuration) % SUBDIVISIONS_PER_BAR;

    if (subdivision !== subdivisionRef.current) {
      subdivisionRef.current = subdivision;

      const step = stepMapRef.current.get(subdivision);
      if (step) {
        const jitter = (Math.random() - 0.5) * HUMANIZE_MS;
        const velocity = step.stroke === "down"
          ? 0.85 + Math.random() * 0.25
          : 0.55 + Math.random() * 0.25;

        const barId = barIdRef.current;
        const delay = Math.max(0, jitter);
        setTimeout(() => {
          if (
            isPlayingRef.current &&
            barId === barIdRef.current &&
            subdivisionRef.current === subdivision
          ) {
            onStrokeRef.current(step.stroke, subdivision, velocity);
          }
        }, delay);
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

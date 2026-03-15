import { useCallback, useEffect, useRef, useState } from "react";

let sharedCtx: AudioContext | null = null;
function getAudioContext() {
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

/**
 * Clicks on the beat grid: originMs, originMs+beatMs, ...
 * Supports accented count-in beats with a different pitch.
 *
 * @param countInBeats - number of count-in beats (accent these with higher pitch)
 */
export function useMetronome(
  bpm: number,
  enabled: boolean,
  originMs: number | null,
  countInBeats = 0,
) {
  const timeoutRef = useRef<number | null>(null);
  const [beat, setBeat] = useState(0);
  const nextBeatIndexRef = useRef(0);

  const playClick = useCallback(
    (isCountIn: boolean) => {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";

      if (isCountIn) {
        // Count-in: louder, higher pitch
        osc.frequency.value = 1200;
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      } else {
        // Normal beat click
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.065);

      setBeat((b) => b + 1);
    },
    [],
  );

  useEffect(() => {
    if (!enabled || bpm <= 0 || originMs === null) {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      nextBeatIndexRef.current = 0;
      return;
    }

    const beatMs = 60_000 / bpm;
    nextBeatIndexRef.current = 0;

    const scheduleNext = () => {
      const k = nextBeatIndexRef.current++;
      const targetTime = originMs + k * beatMs;
      const delay = Math.max(0, targetTime - performance.now());

      timeoutRef.current = window.setTimeout(() => {
        const isCountIn = k < countInBeats;
        playClick(isCountIn);
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, bpm, originMs, countInBeats, playClick]);

  return beat;
}
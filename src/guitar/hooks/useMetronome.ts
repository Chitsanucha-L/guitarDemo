import { useCallback, useEffect, useRef, useState } from "react";

let sharedCtx: AudioContext | null = null;
function getAudioContext() {
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

/**
 * Clicks on the beat grid: originMs, originMs+beatMs, ...
 * Same BPM as chord segments so strum + click line up.
 */
export function useMetronome(bpm: number, enabled: boolean, originMs: number | null) {
  const timeoutRef = useRef<number | null>(null);
  const [beat, setBeat] = useState(0);
  const nextBeatIndexRef = useRef(0);

  const playClick = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.055);

    setBeat((b) => b + 1);
  }, []);

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
        playClick();
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
  }, [enabled, bpm, originMs, playClick]);

  return beat;
}

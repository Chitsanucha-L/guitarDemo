import { useCallback, useRef } from "react";

export function useReferenceTone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const playingFreqRef = useRef<number | null>(null);

  const play = useCallback((frequency: number) => {
    // If same frequency is already playing, stop it (toggle)
    if (playingFreqRef.current === frequency && oscRef.current) {
      stopTone();
      return;
    }

    stopTone();

    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;

    if (ctx.state === "suspended") ctx.resume();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.connect(gain);
    osc.start();
    oscRef.current = osc;
    playingFreqRef.current = frequency;

    // Auto-stop after 2 seconds with fade-out
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
    osc.stop(ctx.currentTime + 2.1);
    osc.onended = () => {
      oscRef.current = null;
      gainRef.current = null;
      playingFreqRef.current = null;
    };
  }, []);

  const stopTone = useCallback(() => {
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch { /* already stopped */ }
      oscRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current = null;
    }
    playingFreqRef.current = null;
  }, []);

  return { play, stop: stopTone };
}

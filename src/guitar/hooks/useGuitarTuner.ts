import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface GuitarString {
  name: string;
  frequency: number;
  octave: string;
}

export const GUITAR_STRINGS: GuitarString[] = [
  { name: "E2", frequency: 82.41, octave: "2" },
  { name: "A2", frequency: 110.0, octave: "2" },
  { name: "D3", frequency: 146.83, octave: "3" },
  { name: "G3", frequency: 196.0, octave: "3" },
  { name: "B3", frequency: 246.94, octave: "3" },
  { name: "E4", frequency: 329.63, octave: "4" },
];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const REF_PITCH_DEFAULT = 440;

const FREQ_MIN_HZ = 65;
const FREQ_MAX_HZ = 450;
const RMS_THRESHOLD = 0.003;

const ATTACK_IGNORE_MS = 60;
const FREQ_HISTORY_SIZE = 5;
const MAX_JUMP_CENTS = 120;
const LOCK_FRAMES = 4;
const UNLOCK_FRAMES = 4;
const HOLD_MS = 1200;

function frequencyToNote(freq: number, referencePitch: number): { note: string; cents: number } {
  const semitoneFromA4 = 12 * Math.log2(freq / referencePitch);
  const midi = 69 + semitoneFromA4;
  const midiRounded = Math.round(midi);
  const cents = Math.round((midi - midiRounded) * 100);
  const noteIndex = ((midiRounded % 12) + 12) % 12;
  const octave = Math.floor(midiRounded / 12) - 1;
  return { note: `${NOTE_NAMES[noteIndex]}${octave}`, cents };
}

function findClosestString(freq: number, strings: GuitarString[]): GuitarString {
  let closest = strings[0];
  let minDist = Infinity;
  for (const s of strings) {
    const dist = Math.abs(1200 * Math.log2(freq / s.frequency));
    if (dist < minDist) {
      minDist = dist;
      closest = s;
    }
  }
  return closest;
}

function centsFromTarget(freq: number, targetFreq: number): number {
  return Math.round(1200 * Math.log2(freq / targetFreq));
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * McLeod Pitch Method (MPM) — pitch detection via Normalized Square
 * Difference Function (NSDF).  Key advantages over raw autocorrelation:
 *   • NSDF is bounded to [-1, 1], so a single clarity threshold works
 *     across all amplitudes and frequencies.
 *   • "Key maxima" selection naturally favors the fundamental period
 *     over harmonics, drastically reducing octave-error rate.
 *   • Parabolic interpolation gives sub-sample precision (~±0.1 Hz).
 */
function detectPitch(buf: ArrayLike<number>, sampleRate: number): number | null {
  const SIZE = buf.length;

  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < RMS_THRESHOLD) return null;

  const minLag = Math.floor(sampleRate / FREQ_MAX_HZ);
  const maxLag = Math.ceil(sampleRate / FREQ_MIN_HZ);
  if (maxLag >= SIZE) return null;

  // NSDF: nsdf(τ) = 2·r(τ) / [m(0,τ) + m(τ,τ)]
  const nsdf = new Float32Array(maxLag + 1);
  for (let tau = minLag; tau <= maxLag; tau++) {
    let acf = 0;
    let energy = 0;
    const limit = SIZE - tau;
    for (let i = 0; i < limit; i++) {
      acf += buf[i] * buf[i + tau];
      energy += buf[i] * buf[i] + buf[i + tau] * buf[i + tau];
    }
    nsdf[tau] = energy > 0 ? (2 * acf) / energy : 0;
  }

  // Collect key maxima — the peak of each positive lobe of the NSDF
  const keyMaxima: { lag: number; val: number }[] = [];
  let inPositive = nsdf[minLag] > 0;
  let peakLag = minLag;
  let peakVal = nsdf[minLag];

  for (let i = minLag + 1; i <= maxLag; i++) {
    if (nsdf[i] > 0) {
      if (!inPositive) {
        inPositive = true;
        peakLag = i;
        peakVal = nsdf[i];
      } else if (nsdf[i] > peakVal) {
        peakLag = i;
        peakVal = nsdf[i];
      }
    } else if (inPositive) {
      inPositive = false;
      keyMaxima.push({ lag: peakLag, val: peakVal });
    }
  }
  if (inPositive) keyMaxima.push({ lag: peakLag, val: peakVal });

  if (keyMaxima.length === 0) return null;

  let bestVal = -Infinity;
  for (const km of keyMaxima) if (km.val > bestVal) bestVal = km.val;

  if (bestVal < 0.25) return null;

  // Pick first key maximum ≥ 93% of the best → favors fundamental over harmonics
  const thresh = 0.93 * bestVal;
  let selected: { lag: number; val: number } | null = null;
  for (const km of keyMaxima) {
    if (km.val >= thresh) {
      selected = km;
      break;
    }
  }
  if (!selected) return null;

  // Parabolic interpolation for sub-sample precision
  const { lag } = selected;
  const y0 = lag > minLag ? nsdf[lag - 1] : nsdf[lag];
  const y1 = nsdf[lag];
  const y2 = lag < maxLag ? nsdf[lag + 1] : nsdf[lag];
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (y0 - y2) / (2 * denom) : 0;
  const refined = lag + (isFinite(shift) ? shift : 0);

  if (refined <= 0) return null;
  const freq = sampleRate / refined;
  return freq >= FREQ_MIN_HZ && freq <= FREQ_MAX_HZ ? freq : null;
}

export interface TunerState {
  isListening: boolean;
  frequency: number | null;
  note: string | null;
  cents: number;
  closestString: GuitarString | null;
  centsFromTarget: number;
  targetString: GuitarString | null;
}

export function useGuitarTuner() {
  const [isListening, setIsListening] = useState(false);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cents, setCents] = useState(0);
  const [closestString, setClosestString] = useState<GuitarString | null>(null);
  const [centsFromTargetVal, setCentsFromTarget] = useState(0);
  const [targetString, setTargetString] = useState<GuitarString | null>(null);
  const [inputLevel, setInputLevel] = useState(0);

  const [referencePitch, setReferencePitch] = useState(REF_PITCH_DEFAULT);
  const refPitchRef = useRef(referencePitch);
  refPitchRef.current = referencePitch;

  const guitarStrings = useMemo(
    () =>
      GUITAR_STRINGS.map((s) => ({
        ...s,
        frequency: s.frequency * (referencePitch / REF_PITCH_DEFAULT),
      })),
    [referencePitch],
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);

  const freqHistoryRef = useRef<number[]>([]);
  const lastAcceptedFreqRef = useRef<number | null>(null);
  const sameNoteCountRef = useRef(0);
  const lastSeenNoteRef = useRef<string | null>(null);
  const lockedNoteRef = useRef<string | null>(null);
  const unlockFramesRef = useRef(0);
  const lastValidTimeRef = useRef<number>(0);
  const signalStartRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    bufferRef.current = null;
    freqHistoryRef.current = [];
    lastAcceptedFreqRef.current = null;
    sameNoteCountRef.current = 0;
    lastSeenNoteRef.current = null;
    lockedNoteRef.current = null;
    unlockFramesRef.current = 0;
    lastValidTimeRef.current = 0;
    signalStartRef.current = null;
    setIsListening(false);
    setFrequency(null);
    setNote(null);
    setCents(0);
    setClosestString(null);
    setCentsFromTarget(0);
    setInputLevel(0);
  }, []);

  const start = useCallback(async () => {
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      source.connect(analyser);
      analyserRef.current = analyser;

      const buffer = new Float32Array(analyser.fftSize);
      bufferRef.current = buffer;

      setIsListening(true);

      const tick = () => {
        if (!analyserRef.current || !bufferRef.current || !audioCtxRef.current) return;

        const buf = bufferRef.current;
        // @ts-expect-error Float32Array<ArrayBufferLike> vs Float32Array<ArrayBuffer> — runtime compatible
        analyserRef.current.getFloatTimeDomainData(buf);

        let rms = 0;
        for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / buf.length);
        setInputLevel(rms);

        const now = performance.now();
        const refPitch = refPitchRef.current;
        const strings = GUITAR_STRINGS.map((s) => ({
          ...s,
          frequency: s.frequency * (refPitch / REF_PITCH_DEFAULT),
        }));

        let rawFreq = detectPitch(buf, audioCtxRef.current.sampleRate);

        // Attack suppression: ignore chaotic transient after pluck onset
        if (rms >= RMS_THRESHOLD) {
          if (signalStartRef.current === null) signalStartRef.current = now;
          if (now - signalStartRef.current < ATTACK_IGNORE_MS) rawFreq = null;
        } else {
          signalStartRef.current = null;
        }

        if (rawFreq !== null && rawFreq >= FREQ_MIN_HZ && rawFreq <= FREQ_MAX_HZ) {
          // Octave correction: if half-frequency is closer to a guitar string, prefer it
          const half = rawFreq / 2;
          if (half >= FREQ_MIN_HZ) {
            const distFull = Math.abs(
              1200 * Math.log2(rawFreq / findClosestString(rawFreq, strings).frequency),
            );
            const distHalf = Math.abs(
              1200 * Math.log2(half / findClosestString(half, strings).frequency),
            );
            if (distHalf < distFull - 50) rawFreq = half;
          }

          // Cents-based jump rejection (uniform across all octaves)
          const last = lastAcceptedFreqRef.current;
          if (last !== null) {
            const jumpCents = Math.abs(1200 * Math.log2(rawFreq / last));
            if (jumpCents > MAX_JUMP_CENTS) {
              rawFreq = null;
            }
          }
          if (rawFreq !== null) lastAcceptedFreqRef.current = rawFreq;
        } else {
          rawFreq = null;
        }

        if (rawFreq !== null) {
          lastValidTimeRef.current = now;

          const history = freqHistoryRef.current;
          history.push(rawFreq);
          if (history.length > FREQ_HISTORY_SIZE) history.shift();
          const smoothFreq = median(history);

          const noteInfo = frequencyToNote(smoothFreq, refPitch);
          const closest = findClosestString(smoothFreq, strings);

          // Note locking: stabilize note name without freezing the frequency display
          const locked = lockedNoteRef.current;
          if (locked !== null) {
            if (noteInfo.note === locked) {
              unlockFramesRef.current = 0;
            } else {
              unlockFramesRef.current += 1;
              if (unlockFramesRef.current >= UNLOCK_FRAMES) {
                lockedNoteRef.current = null;
                sameNoteCountRef.current = 0;
              }
            }
          } else {
            if (lastSeenNoteRef.current === noteInfo.note) {
              sameNoteCountRef.current += 1;
              if (sameNoteCountRef.current >= LOCK_FRAMES) {
                lockedNoteRef.current = noteInfo.note;
              }
            } else {
              sameNoteCountRef.current = 1;
              lastSeenNoteRef.current = noteInfo.note;
            }
          }

          setFrequency(Math.round(smoothFreq * 10) / 10);
          setNote(lockedNoteRef.current ?? noteInfo.note);
          setCents(noteInfo.cents);
          setClosestString(closest);
        } else {
          const history = freqHistoryRef.current;
          const elapsed = now - lastValidTimeRef.current;

          // Progressive reset: allow next pluck to be accepted quickly
          if (elapsed > 100) lastAcceptedFreqRef.current = null;
          if (elapsed > 300) {
            lockedNoteRef.current = null;
            sameNoteCountRef.current = 0;
            lastSeenNoteRef.current = null;
          }

          if (history.length > 0 && elapsed < HOLD_MS) {
            const smoothFreq = median(history);
            const noteInfo = frequencyToNote(smoothFreq, refPitch);
            const closest = findClosestString(smoothFreq, strings);
            setFrequency(Math.round(smoothFreq * 10) / 10);
            setNote(lockedNoteRef.current ?? noteInfo.note);
            setCents(noteInfo.cents);
            setClosestString(closest);
          } else {
            freqHistoryRef.current = [];
            lastAcceptedFreqRef.current = null;
            lastSeenNoteRef.current = null;
            lockedNoteRef.current = null;
            sameNoteCountRef.current = 0;
            setFrequency(null);
            setNote(null);
            setCents(0);
            setClosestString(null);
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setIsListening(false);
    }
  }, [stop]);

  useEffect(() => {
    if (frequency === null) {
      setCentsFromTarget(0);
      return;
    }
    const target = targetString ?? closestString;
    if (target) {
      setCentsFromTarget(centsFromTarget(frequency, target.frequency));
    }
  }, [frequency, targetString, closestString]);

  useEffect(() => stop, [stop]);

  const isTooQuiet = inputLevel < RMS_THRESHOLD;

  return {
    isListening,
    frequency,
    note,
    cents,
    closestString,
    centsFromTarget: centsFromTargetVal,
    targetString,
    setTargetString,
    referencePitch,
    setReferencePitch,
    guitarStrings,
    inputLevel,
    isTooQuiet,
    start,
    stop,
  };
}

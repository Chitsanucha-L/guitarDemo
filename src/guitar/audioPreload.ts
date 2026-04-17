/**
 * Preload all guitar string samples into a single in-memory cache.
 * Fetches each file once; decoded AudioBuffers are reused (no repeated network/decode).
 */

import { reportAudioError } from "./audioError";

const STRINGS = 6;
const FRETS = 21;
export const TOTAL_AUDIO_FILES = STRINGS * FRETS;

/** Per-request timeout so a stuck connection can't hang the loading screen. */
const FETCH_TIMEOUT_MS = 15_000;

const cache: Record<string, AudioBuffer> = {};
let loadingPromise: Promise<void> | null = null;
let onProgressCallback: ((loaded: number, total: number) => void) | null = null;

let sharedAudioContext: AudioContext | null = null;

/**
 * Single shared AudioContext used for both decoding samples and playback.
 * Keeping decode + playback on the same context means decoded AudioBuffers
 * already match the output sample rate, avoiding per-playback resampling
 * (which can add subtle high-frequency hash when multiple voices stack).
 */
export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new Ctor();
  }
  return sharedAudioContext;
}

function getAllKeys(): string[] {
  const keys: string[] = [];
  for (let stringNum = 1; stringNum <= STRINGS; stringNum++) {
    for (let fret = 0; fret <= FRETS - 1; fret++) {
      keys.push(`String_${stringNum}_${fret}`);
    }
  }
  return keys;
}

export function getAudioBufferCache(): Record<string, AudioBuffer> {
  return cache;
}

export function isAudioCacheReady(): boolean {
  return Object.keys(cache).length >= TOTAL_AUDIO_FILES;
}

export type AudioPreloadState = { ready: boolean; progress: number };

const listeners = new Set<(state: AudioPreloadState) => void>();
let lastState: AudioPreloadState = { ready: false, progress: 0 };

function notify(state: AudioPreloadState) {
  lastState = state;
  listeners.forEach((cb) => cb(state));
}

/** Subscribe to preload state (for UI). */
export function subscribeAudioPreload(cb: (state: AudioPreloadState) => void): () => void {
  cb(lastState);
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Start preloading all samples. Safe to call multiple times; runs once.
 * Uses parallel fetches (batches) for speed; decodes with a single AudioContext.
 */
export function startAudioPreload(
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  if (loadingPromise) {
    if (onProgress && isAudioCacheReady()) onProgress(TOTAL_AUDIO_FILES, TOTAL_AUDIO_FILES);
    return loadingPromise;
  }

  onProgressCallback = onProgress ?? null;
  const keys = getAllKeys();

  loadingPromise = (async () => {
    const ctx = getAudioContext();
    const BATCH = 12;
    let loaded = 0;
    let failed = 0;

    const report = () => {
      const pct = TOTAL_AUDIO_FILES ? (loaded / TOTAL_AUDIO_FILES) * 100 : 0;
      notify({ ready: false, progress: pct });
      if (onProgressCallback) onProgressCallback(loaded, TOTAL_AUDIO_FILES);
    };

    for (let i = 0; i < keys.length; i += BATCH) {
      const batch = keys.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (meshName) => {
          const controller = new AbortController();
          const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
          try {
            const res = await fetch(`/sounds/${meshName}.mp3`, {
              cache: "force-cache",
              signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buf = await res.arrayBuffer();
            const decoded = await ctx.decodeAudioData(buf.slice(0));
            return { meshName, decoded };
          } finally {
            clearTimeout(timer);
          }
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          cache[r.value.meshName] = r.value.decoded;
        } else {
          failed++;
        }
        loaded++;
      }
      report();
    }

    // If any sample failed, the guitar is only partially usable — some frets
    // will play silence. Mark ready so the loading screen clears (don't trap
    // the user there), but raise the audio-error latch so the modal can
    // prompt them to reload.
    if (failed > 0 || Object.keys(cache).length < TOTAL_AUDIO_FILES) {
      reportAudioError("preload");
    }
    notify({ ready: true, progress: 100 });
  })();

  return loadingPromise;
}

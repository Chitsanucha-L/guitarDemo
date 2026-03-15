/**
 * Preload all guitar string samples into a single in-memory cache.
 * Fetches each file once; decoded AudioBuffers are reused (no repeated network/decode).
 */

const STRINGS = 6;
const FRETS = 21;
export const TOTAL_AUDIO_FILES = STRINGS * FRETS;

const cache: Record<string, AudioBuffer> = {};
let loadingPromise: Promise<void> | null = null;
let onProgressCallback: ((loaded: number, total: number) => void) | null = null;

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
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const BATCH = 12;
    let loaded = 0;

    const report = () => {
      const pct = TOTAL_AUDIO_FILES ? (loaded / TOTAL_AUDIO_FILES) * 100 : 0;
      notify({ ready: false, progress: pct });
      if (onProgressCallback) onProgressCallback(loaded, TOTAL_AUDIO_FILES);
    };

    for (let i = 0; i < keys.length; i += BATCH) {
      const batch = keys.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (meshName) => {
          const res = await fetch(`/sounds/${meshName}.mp3`, { cache: "force-cache" });
          const buf = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(buf.slice(0));
          return { meshName, decoded };
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          cache[r.value.meshName] = r.value.decoded;
        }
        loaded++;
      }
      report();
    }
    notify({ ready: true, progress: 100 });
  })();

  return loadingPromise;
}

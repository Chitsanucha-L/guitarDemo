/**
 * Global latch + pub/sub for audio failures.
 *
 * Two things can go wrong with the guitar audio:
 *  - "preload": one or more samples failed to fetch/decode during preload, or
 *    preload stalled past the timeout.
 *  - "playback": the user pressed a string but the corresponding buffer is
 *    missing from the cache (so nothing plays).
 *
 * Either is unrecoverable from inside the app (the decode step can't be
 * retried cleanly on an existing AudioContext without a reload), so once we
 * report an error we latch it and surface a modal asking the user to reload.
 */

export type AudioErrorReason = "preload" | "playback";

export interface AudioErrorState {
  hasError: boolean;
  reason: AudioErrorReason | null;
}

let state: AudioErrorState = { hasError: false, reason: null };
const listeners = new Set<(s: AudioErrorState) => void>();

function emit() {
  listeners.forEach((cb) => cb(state));
}

/**
 * Latches an error of the given reason. Subsequent calls are ignored unless
 * the reason escalates from "playback" to "preload" (preload is the root
 * cause and a more informative message for the user).
 */
export function reportAudioError(reason: AudioErrorReason) {
  if (state.hasError && state.reason === "preload") return;
  if (state.hasError && reason === "playback") return;
  state = { hasError: true, reason };
  emit();
}

export function getAudioError(): AudioErrorState {
  return state;
}

export function subscribeAudioError(cb: (s: AudioErrorState) => void): () => void {
  cb(state);
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Test/debug only: clear the latched error. Not wired to any UI. */
export function resetAudioError() {
  state = { hasError: false, reason: null };
  emit();
}

// ---------------------------------------------------------------------------
// Dev-only manual triggers.
//
// Gated by `import.meta.env.DEV` so the whole block is tree-shaken out of
// production builds. Gives you two ways to pop the modal while developing:
//
//   1. Keyboard: Ctrl/Cmd + Shift + E          → reports a "preload" error.
//      (Use Ctrl/Cmd + Shift + P for "playback".)
//   2. DevTools console:
//        __triggerAudioError()                 // defaults to "preload"
//        __triggerAudioError("playback")
//        __clearAudioError()                   // dismiss + reset latch
// ---------------------------------------------------------------------------
if (import.meta.env.DEV && typeof window !== "undefined") {
  const w = window as unknown as {
    __triggerAudioError?: (reason?: AudioErrorReason) => void;
    __clearAudioError?: () => void;
    __audioErrorKeydownInstalled?: boolean;
  };

  w.__triggerAudioError = (reason: AudioErrorReason = "preload") => {
    resetAudioError();
    reportAudioError(reason);
  };
  w.__clearAudioError = resetAudioError;

  // Guard against HMR re-executing this module and stacking listeners.
  if (!w.__audioErrorKeydownInstalled) {
    w.__audioErrorKeydownInstalled = true;
    window.addEventListener("keydown", (e) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      const key = e.key.toLowerCase();
      if (key === "e") {
        e.preventDefault();
        resetAudioError();
        reportAudioError("preload");
      } else if (key === "p") {
        e.preventDefault();
        resetAudioError();
        reportAudioError("playback");
      }
    });
    // eslint-disable-next-line no-console
    console.info(
      "[audioError] dev helpers ready · Ctrl/Cmd+Shift+E (preload), Ctrl/Cmd+Shift+P (playback), or __triggerAudioError() in console",
    );
  }
}

import { useEffect, useMemo, useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import type { ChordData } from "../data/types";
import { stringToNote, getNoteName } from "../data/constants";
import { getAudioBufferCache, getAudioContext } from "../audioPreload";
import { reportAudioError } from "../audioError";

export function useGuitarAudio(
  highlightChord: ChordData | null,
  onNotePlay: (note: string) => void,
  chordRef?: MutableRefObject<ChordData | null>,
) {
  const audioContext = useMemo(() => getAudioContext(), []);
  /** Use shared preload cache so we never re-fetch/re-decode; no local loading. */
  const sounds = useMemo(() => getAudioBufferCache(), []);
  const volume = 0.3;

  /**
   * Master bus: compressor + gain → destination.
   *
   * All voices route through here instead of straight to `destination`. When
   * several strings are plucked at once (e.g. a full 6-string strum) their
   * summed amplitude can exceed ±1.0 and get hard-clipped by the browser,
   * which sounds like gritty digital noise. A mild compressor tames peaks
   * before they reach the output.
   */
  const masterBus = useMemo(() => {
    const comp = audioContext.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-6, audioContext.currentTime);
    comp.knee.setValueAtTime(12, audioContext.currentTime);
    comp.ratio.setValueAtTime(4, audioContext.currentTime);
    comp.attack.setValueAtTime(0.003, audioContext.currentTime);
    comp.release.setValueAtTime(0.15, audioContext.currentTime);

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.9, audioContext.currentTime);

    comp.connect(gain);
    gain.connect(audioContext.destination);
    return comp;
  }, [audioContext]);

  const lastPlayed = useRef<{ meshName: string; time: number } | null>(null);
  const strumGeneration = useRef(0);
  const noteDisplayTimeout = useRef<number | null>(null);
  const activeSources = useRef<Map<number, { source: AudioBufferSourceNode; gain: GainNode }>>(new Map());

  useEffect(() => {
    return () => {
      if (noteDisplayTimeout.current) {
        clearTimeout(noteDisplayTimeout.current);
      }
    };
  }, []);

  const playSound = useCallback((
    meshName: string,
    stringNum: number,
    fret: number,
    skipTimeCheck = false,
    volumeMultiplier = 1,
  ) => {
    if (audioContext.state === "suspended") audioContext.resume();

    // ป้องกันการเล่นซ้ำเร็วเกิน 250ms ทั้ง click mode และ drag mode
    // ยกเว้นกรณี strum (skipTimeCheck = true)
    if (!skipTimeCheck) {
      const now = performance.now();
      if (lastPlayed.current?.meshName === meshName && now - lastPlayed.current.time < 250) return;
      lastPlayed.current = { meshName, time: now };
    }

    const buf = sounds[meshName];
    if (!buf) {
      // The user pressed a string but we have no sample to play for it.
      // This means the preload either never completed for this key or the
      // cache was somehow cleared. Surface the audio-error modal so the
      // user knows to reload rather than silently failing.
      reportAudioError("playback");
      return;
    }

    const now = audioContext.currentTime;

    // Voice stealing: fade the previous note on this string to silence before
    // starting a new one. Schedule the starting value explicitly so the ramp
    // has a defined origin (mixing `.value = x` with `linearRampToValueAtTime`
    // without an anchor can cause micro-clicks during fast replacements).
    const prev = activeSources.current.get(stringNum);
    if (prev) {
      try {
        const g = prev.gain.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + 0.03);
        prev.source.stop(now + 0.035);
      } catch { /* already stopped */ }
    }

    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const gainNode = audioContext.createGain();

    // Short attack envelope (3 ms) so the voice's gain steps up smoothly
    // instead of snapping to its target value. Keeps the transient clean
    // even when six of them stack up during a strum.
    const target = volume * Math.min(1, Math.max(0, volumeMultiplier));
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(target, now + 0.003);

    src.connect(gainNode);
    gainNode.connect(masterBus);
    src.start(now);

    activeSources.current.set(stringNum, { source: src, gain: gainNode });
    src.onended = () => {
      if (activeSources.current.get(stringNum)?.source === src) {
        activeSources.current.delete(stringNum);
      }
    };

    // แสดงชื่อโน้ตบนหน้าจอ
    const noteName = getNoteName(stringNum, fret);
    onNotePlay(noteName);

    // ล้าง timeout เก่าถ้ามี (reset timer)
    if (noteDisplayTimeout.current) {
      clearTimeout(noteDisplayTimeout.current);
    }

    // ตั้ง timeout ใหม่สำหรับซ่อนชื่อโน้ตหลังจาก 2 วินาที
    noteDisplayTimeout.current = window.setTimeout(() => {
      onNotePlay("");
      noteDisplayTimeout.current = null;
    }, 2000);
  }, [audioContext, sounds, onNotePlay, masterBus]);

  const strumDirection = useCallback(async (direction: "down" | "up", delayMs = 75, subdivision?: number) => {
    // Bump generation — any in-flight strum with an older gen will stop itself
    const gen = ++strumGeneration.current;

    const chord = chordRef?.current ?? highlightChord;

    // Down: bass-to-treble (6→1), Up: treble-to-bass (1→6)
    const order = direction === "down"
      ? [6, 5, 4, 3, 2, 1]
      : [1, 2, 3, 4, 5, 6];

    // Manual strum (spacebar, no subdivision): play ALL 6 strings
    // Strumming engine: main beats (0,4,8,12) = all strings; off-beats = partial (3 primary)
    const playAllStrings = subdivision === undefined || subdivision % 4 === 0;

    const primaryStrings: Set<number> = direction === "down"
      ? new Set([6, 5, 4])
      : new Set([1, 2, 3]);

    const SECONDARY_PLAY_CHANCE = 0.45;
    const SECONDARY_VOLUME = 0.35;

    for (const stringNum of order) {
      if (strumGeneration.current !== gen) return;

      const isPrimary = playAllStrings || primaryStrings.has(stringNum);

      if (!isPrimary && Math.random() > SECONDARY_PLAY_CHANCE) continue;

      let fret = 0;
      if (chord) {
        const noteName = stringToNote[stringNum];
        if (noteName && chord.notes[noteName]) {
          const chordFret = chord.notes[noteName].fret;
          if (chordFret >= 0) fret = chordFret;
        }
      }

      const meshName = `String_${stringNum}_${fret}`;
      const vol = isPrimary ? 1 : SECONDARY_VOLUME;
      playSound(meshName, stringNum, fret, true, vol);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }, [playSound, highlightChord, chordRef]);

  const strumAllStrings = useCallback(async () => {
    strumDirection("down");
  }, [strumDirection]);

  const stopAllStrings = useCallback(() => {
    const now = audioContext.currentTime;
    for (const [, node] of activeSources.current) {
      try {
        const g = node.gain.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + 0.05);
        node.source.stop(now + 0.055);
      } catch { /* already stopped */ }
    }
    activeSources.current.clear();
  }, [audioContext]);

  return {
    playSound,
    strumAllStrings,
    strumDirection,
    stopAllStrings,
  };
}

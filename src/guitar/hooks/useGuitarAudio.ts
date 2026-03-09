import { useEffect, useMemo, useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import type { ChordData } from "../data/types";
import { stringToNote, getNoteName } from "../data/constants";

export function useGuitarAudio(
  highlightChord: ChordData | null,
  onNotePlay: (note: string) => void,
  chordRef?: MutableRefObject<ChordData | null>,
) {
  const audioContext = useMemo(() => new (window.AudioContext || (window as any).webkitAudioContext)(), []);
  const sounds = useMemo<{ [key: string]: AudioBuffer }>(() => ({}), []);
  const volume = 0.3;

  const lastPlayed = useRef<{ meshName: string; time: number } | null>(null);
  const strumGeneration = useRef(0);
  const noteDisplayTimeout = useRef<number | null>(null);
  const activeSources = useRef<Map<number, { source: AudioBufferSourceNode; gain: GainNode }>>(new Map());

  // โหลดเสียงทุกไฟล์
  useEffect(() => {
    async function loadSounds() {
      // โหลดเสียงทุกสาย (1-6) ทุก fret (0-20)
      for (let stringNum = 1; stringNum <= 6; stringNum++) {
        for (let fret = 0; fret <= 20; fret++) {
          const meshName = `String_${stringNum}_${fret}`;
          try {
            const res = await fetch(`/sounds/${meshName}.mp3`);
            const buf = await res.arrayBuffer();
            sounds[meshName] = await audioContext.decodeAudioData(buf);
          } catch (err) {
            console.warn(`Cannot load ${meshName}`, err);
          }
        }
      }
    }
    loadSounds();

    // Cleanup: ล้าง timeout เมื่อ component ถูก unmount
    return () => {
      if (noteDisplayTimeout.current) {
        clearTimeout(noteDisplayTimeout.current);
      }
    };
  }, [audioContext, sounds]);

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
    if (!buf) return;

    const prev = activeSources.current.get(stringNum);
    if (prev) {
      try {
        prev.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.03);
        prev.source.stop(audioContext.currentTime + 0.03);
      } catch { /* already stopped */ }
    }

    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume * Math.min(1, Math.max(0, volumeMultiplier));
    src.connect(gainNode);
    gainNode.connect(audioContext.destination);
    src.start();

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
  }, [audioContext, sounds, onNotePlay]);

  const strumDirection = useCallback(async (direction: "down" | "up", delayMs = 75, subdivision?: number) => {
    // Bump generation — any in-flight strum with an older gen will stop itself
    const gen = ++strumGeneration.current;

    const chord = chordRef?.current ?? highlightChord;

    // Down: bass-to-treble (6→1), Up: treble-to-bass (1→6)
    const order = direction === "down"
      ? [6, 5, 4, 3, 2, 1]
      : [1, 2, 3, 4, 5, 6];

    // Main beats (quarter notes): play ALL 6 strings at full volume
    const isMainBeat = subdivision !== undefined && subdivision % 4 === 0;

    const primaryStrings: Set<number> = direction === "down"
      ? new Set([6, 5, 4])
      : new Set([1, 2, 3]);

    const SECONDARY_PLAY_CHANCE = 0.45;
    const SECONDARY_VOLUME = 0.35;

    for (const stringNum of order) {
      if (strumGeneration.current !== gen) return;

      const isPrimary = isMainBeat || primaryStrings.has(stringNum);

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
    for (const [, node] of activeSources.current) {
      try {
        node.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
        node.source.stop(audioContext.currentTime + 0.05);
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

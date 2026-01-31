import { useEffect, useMemo, useCallback, useRef } from "react";
import type { ChordData } from "../data/types";
import { stringToNote, getNoteName } from "../data/constants";

export function useGuitarAudio(
  highlightChord: ChordData | null,
  onNotePlay: (note: string) => void
) {
  const audioContext = useMemo(() => new (window.AudioContext || (window as any).webkitAudioContext)(), []);
  const sounds = useMemo<{ [key: string]: AudioBuffer }>(() => ({}), []);
  const volume = 0.3;

  const lastPlayed = useRef<{ meshName: string; time: number } | null>(null);
  const isStrumming = useRef(false);
  const noteDisplayTimeout = useRef<number | null>(null);

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

  const playSound = useCallback((meshName: string, stringNum: number, fret: number, skipTimeCheck = false) => {
    if (audioContext.state === "suspended") audioContext.resume();

    // ป้องกันการเล่นซ้ำเร็วเกิน 250ms ทั้ง click mode และ drag mode
    // ยกเว้นกรณี strum (skipTimeCheck = true)
    if (!skipTimeCheck) {
      const now = performance.now();
      if (lastPlayed.current?.meshName === meshName && now - lastPlayed.current.time < 250) return;
      lastPlayed.current = { meshName, time: now };
    }

    const buf = sounds[meshName];
    if (!buf) return; // ถ้าโหลดเสียงไม่ทัน ให้เงียบไปเลย

    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    src.connect(gainNode);
    gainNode.connect(audioContext.destination);
    src.start();

    // แสดงชื่อโน้ตบนหน้าจอ
    const noteName = getNoteName(stringNum, fret);
    onNotePlay(noteName);

    // ล้าง timeout เก่าถ้ามี (reset timer)
    if (noteDisplayTimeout.current) {
      clearTimeout(noteDisplayTimeout.current);
    }

    // ตั้ง timeout ใหม่สำหรับซ่อนชื่อโน้ตหลังจาก 2 วินาที
    noteDisplayTimeout.current = setTimeout(() => {
      onNotePlay("");
      noteDisplayTimeout.current = null;
    }, 2000);
  }, [audioContext, sounds, onNotePlay]);

  // ฟังก์ชัน strum - เล่นเสียงจากสาย 6 ถึงสาย 1
  const strumAllStrings = useCallback(async () => {
    if (isStrumming.current) return; // ป้องกันการ strum ซ้อนกัน
    isStrumming.current = true;

    // เล่นเสียงแต่ละสายโดยมี delay 50ms ระหว่างแต่ละสาย
    for (let stringNum = 6; stringNum >= 1; stringNum--) {
      let fret = 0; // default เป็น open string

      // ถ้ามี highlightChord ให้ใช้ fret จากคอร์ด
      if (highlightChord) {
        const noteName = stringToNote[stringNum];
        if (noteName && highlightChord.notes[noteName]) {
          fret = highlightChord.notes[noteName].fret;
        }
      }

      const meshName = `String_${stringNum}_${fret}`;
      playSound(meshName, stringNum, fret, true); // skipTimeCheck = true
      await new Promise(resolve => setTimeout(resolve, 50)); // delay 50ms
    }

    isStrumming.current = false;
  }, [playSound, highlightChord]);

  return {
    playSound,
    strumAllStrings,
  };
}

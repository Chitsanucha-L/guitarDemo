import { useEffect, useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import type { ChordData } from "../data/types";
import { stringToNote } from "../data/constants";

export function useGuitarInteraction(
  canPlay: boolean,
  highlightChord: ChordData | null,
  stringMeshes: React.MutableRefObject<THREE.Mesh[]>,
  playSound: (meshName: string, stringNum: number, fret: number, skipTimeCheck?: boolean) => void,
  strumAllStrings: () => void,
  onStringPress?: (stringNum: number, fret: number) => void
) {
  const isDragging = useRef(false);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const currentHitbox = useRef<string | null>(null);

  // Event listener สำหรับ spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && canPlay) {
        e.preventDefault(); // ป้องกัน scroll หน้าเว็บ
        strumAllStrings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canPlay, strumAllStrings]);

  // คลิกบนสายที่ไม่ใช่ open string (fret > 0)
  const handleClick = useCallback((e: any) => {
    if (!canPlay) return;

    // เล่นเฉพาะ fret ที่ไม่ใช่ 0
    if (e.object && e.object.userData) {
      const userData = e.object.userData;
      if (userData.meshName && userData.stringNum && userData.fret !== undefined && userData.fret > 0) {
        playSound(userData.meshName, userData.stringNum, userData.fret);
        // Notify game mode if callback exists
        if (onStringPress) {
          onStringPress(userData.stringNum, userData.fret);
        }
      }
    }
  }, [canPlay, playSound, onStringPress]);

  // ฟังก์ชันช่วยในการหา fret ที่ถูกต้องจากคอร์ด
  const getFretForString = useCallback((stringNum: number, currentFret: number): number => {
    // ถ้าไม่ใช่ open string (fret !== 0) ใช้ fret ปัจจุบัน
    if (currentFret !== 0) return currentFret;

    // ถ้าไม่มีคอร์ดที่เลือก ใช้ open string
    if (!highlightChord) return 0;

    // หา note name จากเลขสาย
    const noteName = stringToNote[stringNum];
    if (noteName && highlightChord.notes[noteName]) {
      return highlightChord.notes[noteName].fret;
    }

    return 0; // default เป็น open string
  }, [highlightChord]);

  // ลากผ่าน open strings (fret 0)
  const handlePointerDown = useCallback((e: any) => {
    if (!canPlay) return;
    isDragging.current = true;

    // ตรวจสอบว่าเริ่มต้นที่ open string หรือไม่
    if (e.object && e.object.userData) {
      const userData = e.object.userData;
      if (userData.fret === 0 && userData.meshName && userData.stringNum !== undefined) {
        // หา fret ที่ถูกต้องจากคอร์ด
        const actualFret = getFretForString(userData.stringNum, userData.fret);
        const actualMeshName = `String_${userData.stringNum}_${actualFret}`;

        currentHitbox.current = userData.meshName; // จำ hitbox ปัจจุบัน
        playSound(actualMeshName, userData.stringNum, actualFret);
        // Notify game mode if callback exists
        if (onStringPress) {
          onStringPress(userData.stringNum, actualFret);
        }
      }
    }
  }, [canPlay, getFretForString, playSound, onStringPress]);

  const handlePointerMove = useCallback((e: any) => {
    if (!canPlay || !isDragging.current) return;

    // ใช้ raycaster เพื่อหา mesh ที่เมาส์อยู่เหนือ
    raycaster.setFromCamera(e.pointer, e.camera);
    const intersects = raycaster.intersectObjects(stringMeshes.current);

    if (intersects.length > 0) {
      const userData = intersects[0].object.userData;
      // เล่นเสียงเฉพาะ open string (fret 0) เท่านั้น
      if (userData.fret === 0 && userData.meshName && userData.stringNum !== undefined) {
        // เล่นเสียงเฉพาะเมื่อเข้า hitbox ใหม่ที่ต่างจากเดิม
        if (currentHitbox.current !== userData.meshName) {
          currentHitbox.current = userData.meshName;

          // หา fret ที่ถูกต้องจากคอร์ด
          const actualFret = getFretForString(userData.stringNum, userData.fret);
          const actualMeshName = `String_${userData.stringNum}_${actualFret}`;

          playSound(actualMeshName, userData.stringNum, actualFret);
          // Notify game mode if callback exists
          if (onStringPress) {
            onStringPress(userData.stringNum, actualFret);
          }
        }
      }
    } else {
      // เมื่อเมาส์ออกจาก hitbox ทั้งหมด ให้รีเซ็ต
      currentHitbox.current = null;
    }
  }, [canPlay, getFretForString, playSound, raycaster, stringMeshes, onStringPress]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    currentHitbox.current = null; // รีเซ็ตเมื่อปล่อยเมาส์
  }, []);

  return {
    handleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

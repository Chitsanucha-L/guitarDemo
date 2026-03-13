import { useEffect, useMemo, useCallback, useRef } from "react";
import * as THREE from "three";
import type { ChordData } from "../data/types";
import { stringToNote } from "../data/constants";

export function useGuitarInteraction(
  canPlay: boolean,
  highlightChord: ChordData | null,
  stringMeshes: React.MutableRefObject<THREE.Mesh[]>,
  playSound: (meshName: string, stringNum: number, fret: number, skipTimeCheck?: boolean) => void,
  strumAllStrings: () => void,
  onStringPress?: (stringNum: number, fret: number) => void,
  onBarrePress?: (strings: { stringNum: number; fret: number }[]) => void,
  gameMode: boolean = false,
) {
  const isDragging = useRef(false);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const currentHitbox = useRef<string | null>(null);

  const barreStartRef = useRef<{ stringNum: number; fret: number } | null>(null);
  const barreStringsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (gameMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && canPlay) {
        e.preventDefault();
        strumAllStrings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canPlay, strumAllStrings, gameMode]);

  const getFretForString = useCallback((stringNum: number, currentFret: number): number => {
    if (currentFret !== 0) return currentFret;
    if (!highlightChord) return 0;

    const noteName = stringToNote[stringNum];
    if (noteName && highlightChord.notes[noteName]) {
      return highlightChord.notes[noteName].fret;
    }

    return 0;
  }, [highlightChord]);

  const handleClick = useCallback((e: any) => {
    if (!canPlay || gameMode) return;
    if (!e.object?.userData) return;

    const userData = e.object.userData;

    if (userData.meshName && userData.stringNum && userData.fret !== undefined && userData.fret > 0) {
      playSound(userData.meshName, userData.stringNum, userData.fret);
      if (onStringPress) {
        onStringPress(userData.stringNum, userData.fret);
      }
    }
  }, [canPlay, playSound, onStringPress, gameMode]);

  const handlePointerDown = useCallback((e: any) => {
    if (!canPlay) return;

    if (gameMode) {
      raycaster.setFromCamera(e.pointer, e.camera);
      const hits = raycaster.intersectObjects(stringMeshes.current);
      if (hits.length === 0) return;

      const userData = hits[0].object.userData;
      if (userData.meshName && userData.stringNum !== undefined && userData.fret !== undefined) {
        playSound(
          `String_${userData.stringNum}_${userData.fret}`,
          userData.stringNum,
          userData.fret,
        );

        if (userData.fret > 0) {
          barreStartRef.current = { stringNum: userData.stringNum, fret: userData.fret };
          barreStringsRef.current = new Set([userData.stringNum]);
          isDragging.current = true;

          if (onStringPress) {
            onStringPress(userData.stringNum, userData.fret);
          }
        }
      }
      return;
    }

    if (!e.object?.userData) return;
    const userData = e.object.userData;
    isDragging.current = true;

    if (userData.fret === 0 && userData.meshName && userData.stringNum !== undefined) {
      const actualFret = getFretForString(userData.stringNum, userData.fret);
      const actualMeshName = `String_${userData.stringNum}_${actualFret}`;

      currentHitbox.current = userData.meshName;
      playSound(actualMeshName, userData.stringNum, actualFret);
      if (onStringPress) {
        onStringPress(userData.stringNum, actualFret);
      }
    }
  }, [canPlay, getFretForString, playSound, onStringPress, gameMode, raycaster, stringMeshes]);

  const handlePointerMove = useCallback((e: any) => {
    if (!canPlay || !isDragging.current) return;

    if (gameMode) {
      if (!barreStartRef.current) return;

      raycaster.setFromCamera(e.pointer, e.camera);
      const hits = raycaster.intersectObjects(stringMeshes.current);
      if (hits.length === 0) return;

      const userData = hits[0].object.userData;
      if (
        userData.fret === barreStartRef.current.fret &&
        userData.stringNum !== undefined &&
        !barreStringsRef.current.has(userData.stringNum)
      ) {
        barreStringsRef.current.add(userData.stringNum);
        playSound(
          `String_${userData.stringNum}_${userData.fret}`,
          userData.stringNum,
          userData.fret,
        );
      }
      return;
    }

    raycaster.setFromCamera(e.pointer, e.camera);
    const intersects = raycaster.intersectObjects(stringMeshes.current);

    if (intersects.length > 0) {
      const userData = intersects[0].object.userData;
      if (userData.fret === 0 && userData.meshName && userData.stringNum !== undefined) {
        if (currentHitbox.current !== userData.meshName) {
          currentHitbox.current = userData.meshName;

          const actualFret = getFretForString(userData.stringNum, userData.fret);
          const actualMeshName = `String_${userData.stringNum}_${actualFret}`;

          playSound(actualMeshName, userData.stringNum, actualFret);
          if (onStringPress) {
            onStringPress(userData.stringNum, actualFret);
          }
        }
      }
    } else {
      currentHitbox.current = null;
    }
  }, [canPlay, getFretForString, playSound, raycaster, stringMeshes, onStringPress, gameMode]);

  const handlePointerUp = useCallback(() => {
    if (gameMode && barreStartRef.current && barreStringsRef.current.size >= 2 && onBarrePress) {
      const fret = barreStartRef.current.fret;
      const strings = Array.from(barreStringsRef.current)
        .sort((a, b) => b - a)
        .map((sn) => ({ stringNum: sn, fret }));
      onBarrePress(strings);
    }

    isDragging.current = false;
    currentHitbox.current = null;
    barreStartRef.current = null;
    barreStringsRef.current = new Set();
  }, [gameMode, onBarrePress]);

  return {
    handleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

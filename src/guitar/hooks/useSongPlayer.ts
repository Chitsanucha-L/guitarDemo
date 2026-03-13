import { useCallback, useEffect, useRef, useState } from "react";
import type { Song } from "../data/songs";
import { resolveChord } from "../data/songs";

export type SongPlayMode = "watch" | "practice";

export function useSongPlayer(song: Song) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<SongPlayMode>("watch");
  const [beatProgress, setBeatProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const timeoutsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const playOriginMsRef = useRef<number | null>(null);
  const [playOriginMs, setPlayOriginMs] = useState<number | null>(null);
  const wasPausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const scheduleFromRef = useRef(0);

  const [chordSeq, setChordSeq] = useState(0);

  currentIndexRef.current = currentIndex;

  const currentEntry = song.chords[currentIndex] ?? null;
  const currentChordName = currentEntry?.chord ?? "";
  const currentChordData = currentChordName ? resolveChord(currentChordName) : null;
  const beatMs = 60_000 / song.tempo;
  const beatDurationMs = beatMs * (currentEntry?.beats ?? 4);

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const advanceChord = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= song.chords.length) {
        setIsPlaying(false);
        setIsFinished(true);
        playOriginMsRef.current = null;
        setPlayOriginMs(null);
        isPlayingRef.current = false;
        return prev;
      }
      return next;
    });
    setBeatProgress(0);
    setChordSeq((s) => s + 1);
  }, [song.chords.length]);

  const scheduleWatchTimeline = useCallback(
    (origin: number, fromIndex: number) => {
      clearAllTimers();
      const scheduleAt = performance.now();
      let cum = 0;

      for (let i = fromIndex; i < song.chords.length; i++) {
        const segMs = beatMs * (song.chords[i]?.beats ?? 4);
        cum += segMs;
        const fireAt = origin + cum;
        const delay = Math.max(0, fireAt - scheduleAt);
        const boundaryAfter = i + 1;

        const id = window.setTimeout(() => {
          if (boundaryAfter >= song.chords.length) {
            setIsPlaying(false);
            setIsFinished(true);
            isPlayingRef.current = false;
            playOriginMsRef.current = null;
            setPlayOriginMs(null);
            clearAllTimers();
          } else {
            setCurrentIndex(boundaryAfter);
            setBeatProgress(0);
            setChordSeq((s) => s + 1);
          }
        }, delay);
        timeoutsRef.current.push(id);
      }

      let remainingMs = 0;
      for (let j = fromIndex; j < song.chords.length; j++) {
        remainingMs += beatMs * (song.chords[j]?.beats ?? 4);
      }
      const endAt = origin + remainingMs;

      const tickProgress = () => {
        if (!isPlayingRef.current) return;
        const now = performance.now();
        if (now >= endAt) return;
        let t = origin;
        for (let j = fromIndex; j < song.chords.length; j++) {
          const d = beatMs * (song.chords[j]?.beats ?? 4);
          if (now < t + d) {
            setBeatProgress((now - t) / d);
            break;
          }
          t += d;
        }
        rafRef.current = requestAnimationFrame(tickProgress);
      };
      rafRef.current = requestAnimationFrame(tickProgress);
    },
    [song.chords, beatMs, clearAllTimers],
  );

  useEffect(() => {
    if (!isPlaying || playMode !== "watch" || isFinished) {
      clearAllTimers();
      return;
    }
    const origin = playOriginMsRef.current;
    if (origin === null) return;

    scheduleWatchTimeline(origin, scheduleFromRef.current);

    return clearAllTimers;
  }, [isPlaying, playMode, isFinished, playOriginMs, scheduleWatchTimeline, clearAllTimers]);

  const play = useCallback(() => {
    const now = performance.now();
    if (isFinished) {
      setCurrentIndex(0);
      setIsFinished(false);
      setBeatProgress(0);
      wasPausedRef.current = false;
      scheduleFromRef.current = 0;
      playOriginMsRef.current = now;
      setPlayOriginMs(now);
    } else if (wasPausedRef.current) {
      scheduleFromRef.current = currentIndexRef.current;
      playOriginMsRef.current = now;
      setPlayOriginMs(now);
      wasPausedRef.current = false;
    } else {
      scheduleFromRef.current = 0;
      playOriginMsRef.current = now;
      setPlayOriginMs(now);
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
    setChordSeq((s) => s + 1);
  }, [isFinished]);

  const pause = useCallback(() => {
    wasPausedRef.current = true;
    isPlayingRef.current = false;
    setIsPlaying(false);
    playOriginMsRef.current = null;
    setPlayOriginMs(null);
    clearAllTimers();
  }, [clearAllTimers]);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const next = useCallback(() => {
    advanceChord();
  }, [advanceChord]);

  const prev = useCallback(() => {
    setCurrentIndex((p) => Math.max(0, p - 1));
    setBeatProgress(0);
    setIsFinished(false);
    setChordSeq((s) => s + 1);
  }, []);

  const restart = useCallback(() => {
    clearAllTimers();
    wasPausedRef.current = false;
    isPlayingRef.current = false;
    setCurrentIndex(0);
    setBeatProgress(0);
    setIsPlaying(false);
    setIsFinished(false);
    playOriginMsRef.current = null;
    setPlayOriginMs(null);
    setChordSeq((s) => s + 1);
  }, [clearAllTimers]);

  const switchMode = useCallback(
    (mode: SongPlayMode) => {
      pause();
      setPlayMode(mode);
    },
    [pause],
  );

  return {
    currentIndex,
    isPlaying,
    playMode,
    currentChordData,
    currentChordName,
    beatProgress,
    isFinished,
    totalChords: song.chords.length,
    beatDurationMs,
    beatMs,
    chordSeq,
    playOriginMs,
    play,
    pause,
    togglePlay,
    next,
    prev,
    restart,
    switchMode,
  };
}

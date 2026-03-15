import { useCallback, useEffect, useRef, useState } from "react";
import type { Song } from "../data/songs";
import { resolveChord } from "../data/songs";

export type SongPlayMode = "watch" | "practice";

/** Number of beats to count in before the song starts */
const COUNT_IN_BEATS = 4;

/**
 * Anticipation offset: fire strum this many ms BEFORE the beat.
 * Compensates for audio pipeline latency (AudioContext + oscillator start).
 * 25ms is imperceptible but makes the strum feel "on the beat" not "after".
 */
const STRUM_ANTICIPATION_MS = 200;

export function useSongPlayer(song: Song) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<SongPlayMode>("watch");
  const [beatProgress, setBeatProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isCountingIn, setIsCountingIn] = useState(false);

  const timeoutsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const playOriginMsRef = useRef<number | null>(null);
  const [playOriginMs, setPlayOriginMs] = useState<number | null>(null);
  const chordOriginMsRef = useRef<number | null>(null);
  const [chordOriginMs, setChordOriginMs] = useState<number | null>(null);

  const wasPausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const scheduleFromRef = useRef(0);

  const [chordSeq, setChordSeq] = useState(0);

  // ★ Strum function ref — set by the page, called directly from setTimeout
  const strumFnRef = useRef<((dir: "down" | "up", delayMs: number) => void) | null>(null);

  currentIndexRef.current = currentIndex;

  const currentEntry = song.chords[currentIndex] ?? null;
  const currentChordName = currentEntry?.chord ?? "";
  const currentChordData = currentChordName ? resolveChord(currentChordName) : null;
  const beatMs = 60_000 / song.tempo;
  const beatDurationMs = beatMs * (currentEntry?.beats ?? 4);
  const countInMs = COUNT_IN_BEATS * beatMs;
  const strumDelayMs = Math.round(Math.min(72, Math.max(18, (beatMs * 0.32) / 5)));

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
        chordOriginMsRef.current = null;
        setChordOriginMs(null);
        isPlayingRef.current = false;
        return prev;
      }
      return next;
    });
    setBeatProgress(0);
    setChordSeq((s) => s + 1);
  }, [song.chords.length]);

  const scheduleWatchTimeline = useCallback(
    (chordOrigin: number, fromIndex: number) => {
      clearAllTimers();
      const scheduleAt = performance.now();
      let cum = 0;

      for (let i = fromIndex; i < song.chords.length; i++) {
        const segMs = beatMs * (song.chords[i]?.beats ?? 4);

        // ★ Schedule strum DIRECTLY from setTimeout — bypasses React entirely.
        // Fire slightly early (anticipation) so audio lands on the beat.
        if (i > fromIndex) {
          const strumTarget = chordOrigin + cum - STRUM_ANTICIPATION_MS;
          const strumDelay = Math.max(0, strumTarget - scheduleAt);
          const strumId = window.setTimeout(() => {
            strumFnRef.current?.("down", strumDelayMs);
          }, strumDelay);
          timeoutsRef.current.push(strumId);
        }

        cum += segMs;
        const fireAt = chordOrigin + cum;
        const delay = Math.max(0, fireAt - scheduleAt);
        const boundaryAfter = i + 1;

        const id = window.setTimeout(() => {
          if (boundaryAfter >= song.chords.length) {
            setIsPlaying(false);
            setIsFinished(true);
            isPlayingRef.current = false;
            playOriginMsRef.current = null;
            setPlayOriginMs(null);
            chordOriginMsRef.current = null;
            setChordOriginMs(null);
            clearAllTimers();
          } else {
            setCurrentIndex(boundaryAfter);
            setBeatProgress(0);
            setChordSeq((s) => s + 1);
          }
        }, delay);
        timeoutsRef.current.push(id);
      }

      // Beat progress animation
      let totalMs = 0;
      for (let j = fromIndex; j < song.chords.length; j++) {
        totalMs += beatMs * (song.chords[j]?.beats ?? 4);
      }
      const endAt = chordOrigin + totalMs;

      const tickProgress = () => {
        if (!isPlayingRef.current) return;
        const now = performance.now();
        if (now >= endAt) return;
        let t = chordOrigin;
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
    [song.chords, beatMs, strumDelayMs, clearAllTimers],
  );

  useEffect(() => {
    if (!isPlaying || playMode !== "watch" || isFinished) {
      clearAllTimers();
      return;
    }
    const origin = chordOriginMsRef.current;
    if (origin === null) return;

    scheduleWatchTimeline(origin, scheduleFromRef.current);

    return clearAllTimers;
  }, [isPlaying, playMode, isFinished, chordOriginMs, scheduleWatchTimeline, clearAllTimers]);

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
      chordOriginMsRef.current = now + countInMs;
      setChordOriginMs(now + countInMs);
      setIsCountingIn(true);

      // ★ First strum at exact beat 0 of the song (after count-in)
      const firstStrumId = window.setTimeout(() => {
        setIsCountingIn(false);
        setChordSeq((s) => s + 1);
        strumFnRef.current?.("down", strumDelayMs);
      }, countInMs);
      timeoutsRef.current.push(firstStrumId);
    } else if (wasPausedRef.current) {
      scheduleFromRef.current = currentIndexRef.current;
      playOriginMsRef.current = now;
      setPlayOriginMs(now);
      chordOriginMsRef.current = now;
      setChordOriginMs(now);
      wasPausedRef.current = false;
      setIsCountingIn(false);

      // Strum immediately on resume
      strumFnRef.current?.("down", strumDelayMs);
    } else {
      scheduleFromRef.current = 0;
      playOriginMsRef.current = now;
      setPlayOriginMs(now);
      chordOriginMsRef.current = now + countInMs;
      setChordOriginMs(now + countInMs);
      setIsCountingIn(true);

      const firstStrumId = window.setTimeout(() => {
        setIsCountingIn(false);
        setChordSeq((s) => s + 1);
        strumFnRef.current?.("down", strumDelayMs);
      }, countInMs);
      timeoutsRef.current.push(firstStrumId);
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
  }, [isFinished, countInMs, strumDelayMs]);

  const pause = useCallback(() => {
    wasPausedRef.current = true;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsCountingIn(false);
    playOriginMsRef.current = null;
    setPlayOriginMs(null);
    chordOriginMsRef.current = null;
    setChordOriginMs(null);
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
    setIsCountingIn(false);
    playOriginMsRef.current = null;
    setPlayOriginMs(null);
    chordOriginMsRef.current = null;
    setChordOriginMs(null);
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
    isCountingIn,
    countInBeats: COUNT_IN_BEATS,
    totalChords: song.chords.length,
    beatDurationMs,
    beatMs,
    chordSeq,
    playOriginMs,
    strumFnRef, // ★ expose ref so page can set it
    play,
    pause,
    togglePlay,
    next,
    prev,
    restart,
    switchMode,
  };
}
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../guitar/ui/Navbar";
import MobileNav from "../guitar/ui/MobileNav";
import GameCanvas from "../guitar/GameCanvas";
import type { StrumDirectionFn } from "../guitar/GuitarModel";
import { SONGS } from "../guitar/data/songs";
import { useSongPlayer } from "../guitar/hooks/useSongPlayer";
import { useMetronome } from "../guitar/hooks/useMetronome";
import useIsMobileLike from "../guitar/hooks/useIsMobileLike";

export default function SongPlayerPage() {
  const { songId } = useParams<{ songId: string }>();
  const { t } = useTranslation();

  const song = SONGS.find((s) => s.id === songId);

  if (!song) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">{t("song.notFound")}</p>
          <Link to="/songs" className="text-yellow-400 underline">{t("song.backToList")}</Link>
        </div>
      </div>
    );
  }

  return <SongPlayerInner song={song} />;
}

function SongPlayerInner({ song }: { song: (typeof SONGS)[number] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lyricsRef = useRef<HTMLDivElement>(null);
  const isMobileLike = useIsMobileLike();

  const {
    currentIndex,
    isPlaying,
    playMode,
    currentChordData,
    currentChordName,
    beatProgress,
    isFinished,
    isCountingIn,
    countInBeats,
    totalChords,
    beatMs,
    playOriginMs,
    strumFnRef,
    next,
    prev,
    togglePlay,
    restart,
    switchMode,
  } = useSongPlayer(song);

  const mobileLineRange = useMemo(() => {
    const chords = song.chords;
    const idx = Math.min(Math.max(currentIndex, 0), chords.length - 1);

    const isBreak = (i: number) => (chords[i]?.lyrics ?? "").trim() === "";
    const hasExplicitBreaks = chords.some((c) => (c.lyrics ?? "").trim() === "");

    if (hasExplicitBreaks) {
      // "One line" = contiguous segment of non-empty lyrics between explicit breaks.
      let start = idx;
      while (start > 0 && !isBreak(start) && !isBreak(start - 1)) start -= 1;
      if (isBreak(start)) {
        while (start < chords.length - 1 && isBreak(start)) start += 1;
      }
      let end = start;
      while (end < chords.length - 1 && !isBreak(end) && !isBreak(end + 1)) end += 1;
      return { start, end };
    }

    // Fallback: group into a stable chunk so it still behaves like "one line".
    const chunk = 7;
    const start = Math.floor(idx / chunk) * chunk;
    const end = Math.min(chords.length - 1, start + chunk - 1);
    return { start, end };
  }, [currentIndex, song.chords]);

  // --- Audio: strum on chord change ---
  // ★ Wire the 3D guitar's strum function directly into useSongPlayer's ref.
  // No more useEffect → no React re-render delay → strum fires from setTimeout.
  const handleStrumReady = useCallback(
    (fn: StrumDirectionFn) => {
      strumFnRef.current = fn;
    },
    [strumFnRef],
  );

  // ★ REMOVED: the old useEffect that fired strum via chordSeq.
  // Strum is now called directly from useSongPlayer's setTimeout callbacks.

  const [metronomeOn, setMetronomeOn] = useState(true);
  useMetronome(song.tempo, isPlaying && metronomeOn, playOriginMs, isCountingIn ? countInBeats : 0);

  // Count-in display: 4 → 3 → 2 → 1
  const countInMs = countInBeats * beatMs;
  const [countInNumber, setCountInNumber] = useState<number | null>(null);
  useEffect(() => {
    if (!isCountingIn || playOriginMs === null) {
      setCountInNumber(null);
      return;
    }
    let rafId: number;
    const tick = () => {
      const elapsed = performance.now() - playOriginMs!;
      if (elapsed >= countInMs) {
        setCountInNumber(null);
        return;
      }
      const beatIndex = Math.floor(elapsed / beatMs);
      const n = beatIndex < countInBeats ? countInBeats - beatIndex : null;
      setCountInNumber(n);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isCountingIn, playOriginMs, beatMs, countInBeats, countInMs]);

  // --- Auto-scroll lyrics (scoped to lyrics container only) ---
  useEffect(() => {
    const container = lyricsRef.current;
    if (!container) return;
    const activeEl = container.querySelector("[data-active='true']") as HTMLElement | null;
    if (!activeEl) return;
    container.scrollTo({
      left: activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2,
      top: activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2,
      behavior: "smooth",
    });
  }, [currentIndex]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        next();
      } else if (e.code === "ArrowLeft") {
        prev();
      } else if (e.code === "KeyM") {
        setMetronomeOn((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, next, prev]);

  const progressPct = totalChords > 0 ? ((currentIndex + 1) / totalChords) * 100 : 0;

  return (
    <div className="flex flex-col w-screen h-dvh overflow-hidden">
      {isMobileLike ? (
        <MobileNav rightModeLabel={t("nav.songMode")} position="static" />
      ) : (
        <Navbar title={t("nav.title")} activeLink="songs" position="static" />
      )}

      {/* Main area: canvas + overlay fill remaining height */}
      <div className="flex-1 relative min-h-0 overflow-hidden bg-[#111111]">
        {/* 3D fretboard (no touch needed) */}
        <div className="absolute inset-0 pointer-events-none">
          <GameCanvas
            currentChord={currentChordData}
            canPlay={false}
            onStrumReady={handleStrumReady}
          />
        </div>

        {/* Scrollable UI overlay */}
        <div className="absolute inset-0 z-20 overflow-y-auto overscroll-contain scrollbar-visible">
        <div className="flex flex-col min-h-full pointer-events-none">

        {/* Top section */}
        <div className="shrink-0 flex flex-col px-3 pt-1.5 lg:pt-4 gap-1 lg:gap-2">
          {isMobileLike ? (
            <div className="relative flex items-start justify-between gap-2">
              {/* Left: Back */}
              <div className="pointer-events-auto shrink-0">
                <button
                  onClick={() => navigate("/songs")}
                  className="bg-gray-900/60 backdrop-blur-md rounded-xl px-2.5 py-1 border border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-[11px] font-medium"
                >
                  &larr; {t("song.backToList")}
                </button>
              </div>

              {/* Center: chord card — absolute so it's truly centered */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none">
                <div className="relative">
                  {countInNumber !== null ? (
                    <>
                      <div className="absolute -inset-1 bg-blue-500/20 rounded-2xl blur-lg" />
                      <div className="relative bg-gray-900/90 backdrop-blur-md rounded-2xl px-4 py-1.5 border-2 border-blue-500/50">
                        <div className="text-[8px] text-white/90 text-center uppercase tracking-wider">COUNT IN</div>
                        <div className="text-lg font-black text-blue-400 text-center tabular-nums">{countInNumber}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute -inset-1 bg-yellow-500/20 rounded-2xl blur-lg" />
                      <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl px-4 py-1.5 border-2 border-yellow-500/40">
                        <div className="text-[8px] text-gray-500 text-center uppercase tracking-wider">{song.title}</div>
                        <div className="text-lg font-black text-yellow-400 text-center tabular-nums">{currentChordName || "—"}</div>
                        <div className="mt-0.5 w-full h-[2px] bg-gray-700/50 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400/80 rounded-full transition-none" style={{ width: `${beatProgress * 100}%` }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Metronome + BPM */}
              <div className="flex gap-1 pointer-events-auto shrink-0 items-center">
                <button
                  onClick={() => setMetronomeOn((v) => !v)}
                  className={`text-[9px] px-2 py-1 rounded-md border transition-colors font-medium flex items-center justify-center ${
                    metronomeOn
                      ? "border-green-500/50 text-green-400 bg-green-500/10"
                      : "border-gray-600/50 text-gray-500 bg-gray-800/40"
                  }`}
                >
                  {metronomeOn ? "ON" : "OFF"}
                </button>
                <div className="bg-gray-900/60 backdrop-blur-md rounded-lg px-1.5 py-1 border border-gray-600/50 text-center">
                  <div className="text-[8px] text-gray-500 uppercase leading-none">{t("song.tempo")}</div>
                  <div className="text-[11px] lg:text-sm font-bold text-white tabular-nums leading-none">{song.tempo}</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Row 1: Back + Tempo/Metronome */}
              <div className="flex items-start justify-between">
                <div className="pointer-events-auto">
                  <button
                    onClick={() => navigate("/songs")}
                    className="bg-gray-900/60 backdrop-blur-md rounded-xl px-2.5 lg:px-4 py-1 lg:py-2 border border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-[11px] lg:text-sm font-medium"
                  >
                    &larr; {t("song.backToList")}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 lg:gap-2 pointer-events-auto">
                  <button
                    onClick={() => setMetronomeOn((v) => !v)}
                    className={`text-[10px] lg:text-sm px-2 py-0.5 lg:py-1 rounded-md border transition-colors font-medium ${
                      metronomeOn
                        ? "border-green-500/50 text-green-400 bg-green-500/10"
                        : "border-gray-600/50 text-gray-500 bg-gray-800/40"
                    }`}
                  >
                    {t("song.metronome")} {metronomeOn ? "ON" : "OFF"}
                  </button>
                  <div className="bg-gray-900/60 backdrop-blur-md rounded-xl px-2 lg:px-4 py-0.5 lg:py-2 border border-gray-600/50 text-center">
                    <div className="text-[9px] lg:text-xs text-gray-500 uppercase leading-tight">{t("song.tempo")}</div>
                    <div className="text-sm lg:text-xl font-bold text-white tabular-nums leading-tight">{song.tempo}</div>
                  </div>
                </div>
              </div>

              {/* Row 2: Chord card (centered, in normal flow) */}
              <div className="flex justify-center pointer-events-none">
                <div className="relative">
                  {countInNumber !== null ? (
                    <>
                      <div className="absolute -inset-1 bg-blue-500/20 rounded-2xl blur-lg" />
                      <div className="relative bg-gray-900/90 backdrop-blur-md rounded-2xl px-5 lg:px-10 py-2 lg:py-3 border-2 border-blue-500/50">
                        <div className="text-[9px] lg:text-xs xl:text-sm text-white/90 text-center uppercase tracking-wider">
                          COUNT IN
                        </div>
                        <div className="text-lg lg:text-4xl xl:text-5xl font-black text-blue-400 text-center tabular-nums">
                          {countInNumber}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute -inset-1 bg-yellow-500/20 rounded-2xl blur-lg" />
                      <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl px-5 lg:px-10 py-2 lg:py-3 border-2 border-yellow-500/40">
                        <div className="text-[10px] lg:text-xs xl:text-sm text-gray-500 text-center uppercase tracking-wider">
                          {song.title}
                        </div>
                        <div className="mt-0 lg:mt-1 text-2xl lg:text-4xl xl:text-5xl font-black text-yellow-400 text-center tabular-nums">
                          {currentChordName || "—"}
                        </div>
                        <div className="mt-1 lg:mt-2 w-full h-1 bg-gray-700/50 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400/80 rounded-full transition-none" style={{ width: `${beatProgress * 100}%` }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Guitar visibility spacer — guarantees minimum guitar window */}
        <div className="flex-1 min-h-[45dvh]" />

        {/* Lyrics panel */}
        <div className="pointer-events-auto mx-2 lg:mx-6 mb-1 lg:mb-3">
          {isMobileLike ? (
            <div className="bg-gray-900/85 backdrop-blur-md rounded-xl border border-gray-700/50 px-1.5 py-0.5">
              <div
                ref={lyricsRef}
                className="flex gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-none py-0.5 px-0.5"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {song.chords.slice(mobileLineRange.start, mobileLineRange.end + 1).map((entry, localIdx) => {
                  const i = mobileLineRange.start + localIdx;
                  const isActive = i === currentIndex && !isCountingIn;
                  const isPast = i < currentIndex;
                  const lyric = (entry.lyrics ?? "").trim();
                  return (
                    <div
                      key={i}
                      data-active={isActive}
                      className={`inline-flex flex-col items-center justify-center rounded-lg px-1.5 py-0.5 transition-all duration-200 min-w-[3.5rem] ${isActive
                          ? "bg-yellow-500/20 border border-yellow-500/50 shadow-lg shadow-yellow-500/10"
                          : isPast
                            ? "opacity-40"
                            : "border border-transparent"
                        }`}
                    >
                      <span
                        className={`text-xs font-bold transition-colors duration-200 ${isActive ? "text-yellow-400" : isPast ? "text-gray-600" : "text-blue-400"
                          }`}
                      >
                        {entry.chord}
                      </span>
                      <span
                        className={`text-[9px] leading-tight text-center ${isActive ? "text-white" : isPast ? "text-gray-600" : "text-gray-400"
                          }`}
                      >
                        {lyric || " "}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              ref={lyricsRef}
              className="bg-gray-900/85 backdrop-blur-md rounded-2xl border border-gray-700/50 px-3 lg:px-6 py-3 lg:py-4 max-h-[7rem] lg:max-h-[11rem] overflow-y-auto scrollbar-thin"
            >
              <div className="flex flex-wrap gap-x-1 gap-y-1.5 lg:gap-x-2 lg:gap-y-2">
                {song.chords.map((entry, i) => {
                  const isActive = i === currentIndex && !isCountingIn;
                  const isPast = i < currentIndex;
                  return (
                    <div
                      key={i}
                      data-active={isActive}
                      className={`flex flex-col items-center rounded-lg px-2 lg:px-3 py-1 lg:py-1.5 transition-all duration-200 min-w-[4rem] lg:min-w-[5.5rem] ${isActive
                          ? "bg-yellow-500/20 border border-yellow-500/50 scale-105 shadow-lg shadow-yellow-500/10"
                          : isPast
                            ? "opacity-40"
                            : "border border-transparent"
                        }`}
                    >
                      <span
                        className={`text-sm lg:text-lg font-bold transition-colors duration-200 ${isActive ? "text-yellow-400" : isPast ? "text-gray-600" : "text-blue-400"
                          }`}
                      >
                        {entry.chord}
                      </span>
                      {entry.lyrics && (
                        <span
                          className={`text-[10px] lg:text-xs leading-tight text-center ${isActive ? "text-white" : isPast ? "text-gray-600" : "text-gray-400"
                            }`}
                        >
                          {entry.lyrics}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="pointer-events-auto pb-1 lg:pb-5 px-2 lg:px-6" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}>
          {/* Song progress */}
          <div className="w-full h-[3px] lg:h-1 bg-gray-800 rounded-full mb-1 lg:mb-4 overflow-hidden">
            <div
              className="h-full bg-yellow-400/60 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {/* Left: Mode toggle (ซ้ายของ cell ซ้าย) */}
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-600/50 bg-gray-800/60 shrink-0 justify-self-start">
              <button
                onClick={() => switchMode("watch")}
                className={`px-2 py-1 text-[10px] lg:text-sm lg:px-4 lg:py-1.5 font-bold transition-all duration-200 ${
                  playMode === "watch"
                    ? "bg-purple-600 text-white"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {t("song.watchMode")}
              </button>
              <button
                onClick={() => switchMode("practice")}
                className={`px-2 py-1 text-[10px] lg:text-sm lg:px-4 lg:py-1.5 font-bold transition-all duration-200 ${
                  playMode === "practice"
                    ? "bg-green-600 text-white"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {t("song.practiceMode")}
              </button>
            </div>

            {/* Center: Transport controls — อยู่กึ่งกลางจอ (คอลัมน์ซ้าย/ขวาเท่ากัน 1fr) */}
            <div className="flex items-center justify-center gap-1.5 lg:gap-3 flex-nowrap">
              <button
                onClick={restart}
                className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center transition-colors border border-gray-600/50"
                title={t("song.restart")}
              >
                <svg className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>

              <button
                onClick={prev}
                disabled={currentIndex === 0 || isCountingIn}
                className="bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center transition-colors border border-gray-600/50"
              >
                <svg className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className={`relative rounded-full w-9 h-9 lg:w-12 lg:h-12 flex items-center justify-center text-white font-bold shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  isFinished
                    ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                    : isPlaying
                      ? "bg-red-500 hover:bg-red-400 shadow-red-500/20"
                      : "bg-green-600 hover:bg-green-500 shadow-green-500/20"
                }`}
              >
                <span
                  className={`absolute inset-0 rounded-full border-2 transition-colors duration-200 ${
                    isFinished
                      ? "border-blue-400/40"
                      : isPlaying
                        ? "border-red-400/40"
                        : "border-green-400/40"
                  }`}
                />
                {isFinished ? (
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={next}
                disabled={currentIndex >= song.chords.length - 1 || isCountingIn}
                className="bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center transition-colors border border-gray-600/50"
              >
                <svg className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6z" />
                </svg>
              </button>
            </div>

            {/* Right: Counter */}
            <div className="text-gray-400 text-xs lg:text-sm font-medium tabular-nums shrink-0 text-right justify-self-end">
              {isCountingIn ? "—" : `${currentIndex + 1} / ${totalChords}`}
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
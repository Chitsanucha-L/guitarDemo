import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../guitar/ui/Navbar";
import GameCanvas from "../guitar/GameCanvas";
import type { StrumDirectionFn } from "../guitar/GuitarModel";
import { SONGS } from "../guitar/data/songs";
import { useSongPlayer } from "../guitar/hooks/useSongPlayer";
import { useMetronome } from "../guitar/hooks/useMetronome";

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

  const {
    currentIndex,
    isPlaying,
    playMode,
    currentChordData,
    currentChordName,
    beatProgress,
    isFinished,
    totalChords,
    chordSeq,
    beatMs,
    playOriginMs,
    next,
    prev,
    togglePlay,
    restart,
    switchMode,
  } = useSongPlayer(song);

  // --- Audio: strum on chord change ---
  const strumFnRef = useRef<StrumDirectionFn | null>(null);

  const handleStrumReady = useCallback((fn: StrumDirectionFn) => {
    strumFnRef.current = fn;
  }, []);

  /** ความเร็วดีดแต่ละสาย ~ สัดส่วนกับ 1 beat — ยิ่ง BPM สูง delay ยิ่งสั้น */
  const strumDelayMs = Math.round(
    Math.min(72, Math.max(18, (beatMs * 0.32) / 5)),
  );

  useEffect(() => {
    if (chordSeq === 0 || !currentChordData) return;
    let a = 0;
    let b = 0;
    a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => {
        strumFnRef.current?.("down", strumDelayMs);
      });
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [chordSeq, currentChordData, strumDelayMs]);

  const [metronomeOn, setMetronomeOn] = useState(true);
  useMetronome(song.tempo, isPlaying && metronomeOn, playOriginMs);

  // --- Auto-scroll lyrics ---
  useEffect(() => {
    const container = lyricsRef.current;
    if (!container) return;
    const activeEl = container.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
    <div className="w-screen h-screen relative overflow-hidden">
      <Navbar title={t("nav.title")} activeLink="songs" />

      {/* 3D fretboard */}
      <div className="absolute top-10 sm:top-15 left-0 right-0 bottom-0 bg-[#111111]">
        <GameCanvas
          currentChord={currentChordData}
          canPlay={false}
          onStrumReady={handleStrumReady}
        />
      </div>

      {/* Overlay */}
      <div className="absolute top-10 sm:top-15 left-0 right-0 bottom-0 pointer-events-none z-20 flex flex-col">

        {/* Top bar */}
        <div className="flex items-start justify-between px-3 sm:px-6 pt-2 sm:pt-4">
          {/* Back */}
          <div className="pointer-events-auto">
            <button
              onClick={() => navigate("/songs")}
              className="bg-gray-900/60 backdrop-blur-md rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-xs sm:text-sm font-medium"
            >
              &larr; {t("song.backToList")}
            </button>
          </div>

          {/* Chord card — center */}
          <div className="absolute top-12 sm:top-16 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="absolute -inset-1 bg-yellow-500/20 rounded-2xl blur-lg" />
              <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl px-6 sm:px-12 py-2.5 sm:py-4 border-2 border-yellow-500/40">
                <div className="text-[10px] sm:text-xs text-gray-500 text-center uppercase tracking-wider">
                  {song.title}
                </div>
                <div className="text-3xl sm:text-6xl font-black text-yellow-400 text-center tabular-nums">
                  {currentChordName || "—"}
                </div>
                {/* Beat progress */}
                <div className="mt-1.5 sm:mt-2 w-full h-1 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400/80 rounded-full transition-none"
                    style={{ width: `${beatProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tempo + Metronome — right */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="bg-gray-900/60 backdrop-blur-md rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-600/50">
              <div className="text-[10px] sm:text-xs text-gray-500 uppercase">{t("song.tempo")}</div>
              <div className="text-lg sm:text-2xl font-bold text-white tabular-nums">{song.tempo}</div>
            </div>
            <button
              onClick={() => setMetronomeOn((v) => !v)}
              className={`pointer-events-auto text-[10px] sm:text-xs px-2 py-0.5 rounded-md border transition-colors font-medium ${
                metronomeOn
                  ? "border-green-500/50 text-green-400 bg-green-500/10"
                  : "border-gray-600/50 text-gray-500 bg-gray-800/40"
              }`}
            >
              {t("song.metronome")} {metronomeOn ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Lyrics panel */}
        <div className="pointer-events-auto mx-2 sm:mx-6 mb-2 sm:mb-3">
          <div
            ref={lyricsRef}
            className="bg-gray-900/85 backdrop-blur-md rounded-2xl border border-gray-700/50 px-3 sm:px-6 py-3 sm:py-4 max-h-[9rem] sm:max-h-[11rem] overflow-y-auto scrollbar-thin"
          >
            <div className="flex flex-wrap gap-x-1 gap-y-1.5 sm:gap-x-2 sm:gap-y-2">
              {song.chords.map((entry, i) => {
                const isActive = i === currentIndex;
                const isPast = i < currentIndex;
                return (
                  <div
                    key={i}
                    data-active={isActive}
                    className={`flex flex-col items-center rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 transition-all duration-200 min-w-[4rem] sm:min-w-[5.5rem] ${
                      isActive
                        ? "bg-yellow-500/20 border border-yellow-500/50 scale-105 shadow-lg shadow-yellow-500/10"
                        : isPast
                          ? "opacity-40"
                          : "border border-transparent"
                    }`}
                  >
                    <span
                      className={`text-sm sm:text-lg font-bold transition-colors duration-200 ${
                        isActive ? "text-yellow-400" : isPast ? "text-gray-600" : "text-blue-400"
                      }`}
                    >
                      {entry.chord}
                    </span>
                    {entry.lyrics && (
                      <span
                        className={`text-[10px] sm:text-xs leading-tight text-center ${
                          isActive ? "text-white" : isPast ? "text-gray-600" : "text-gray-400"
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
        </div>

        {/* Control bar */}
        <div className="pointer-events-auto pb-3 sm:pb-5 px-3 sm:px-6">
          {/* Song progress */}
          <div className="w-full h-1 bg-gray-800 rounded-full mb-3 sm:mb-4 overflow-hidden">
            <div
              className="h-full bg-yellow-400/60 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-5 relative">
            {/* Mode toggle — left */}
            <div className="absolute left-0 inline-flex rounded-lg overflow-hidden border border-gray-600/50 bg-gray-800/60">
              <button
                onClick={() => switchMode("watch")}
                className={`px-2.5 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                  playMode === "watch"
                    ? "bg-purple-600 text-white"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {t("song.watchMode")}
              </button>
              <button
                onClick={() => switchMode("practice")}
                className={`px-2.5 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                  playMode === "practice"
                    ? "bg-green-600 text-white"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {t("song.practiceMode")}
              </button>
            </div>

            {/* Centered transport controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Restart */}
              <button
                onClick={restart}
                className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-colors border border-gray-600/50"
                title={t("song.restart")}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>

              {/* Previous */}
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-colors border border-gray-600/50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </svg>
              </button>

              {/* Play / Pause — large, prominent */}
              <button
                onClick={togglePlay}
                className={`relative rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-white font-bold shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                  isFinished
                    ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                    : isPlaying
                      ? "bg-red-500 hover:bg-red-400 shadow-red-500/20"
                      : "bg-green-600 hover:bg-green-500 shadow-green-500/20"
                }`}
              >
                {/* Glow ring */}
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
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Next */}
              <button
                onClick={next}
                disabled={currentIndex >= song.chords.length - 1}
                className="bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-colors border border-gray-600/50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6z" />
                </svg>
              </button>
            </div>

            {/* Counter — right */}
            <div className="absolute right-0 text-gray-400 text-xs sm:text-sm font-medium tabular-nums">
              {currentIndex + 1} / {totalChords}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

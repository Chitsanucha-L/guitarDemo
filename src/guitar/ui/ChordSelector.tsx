import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ALL_ROOTS,
  ALL_QUALITIES,
  ALL_TENSIONS,
  QUALITY_LABELS,
  buildChordName,
  buildChordNotes,
  type Root,
  type Quality,
  type Tension,
  type ChordSelection,
} from "../types/chord";
import {
  hasFingering,
  canAddTensions,
  resolveChordVoicings,
} from "../data/chordLibrary";
import type { ChordVoicing } from "../data/chordLibrary";

interface ChordSelectorProps {
  selectedChordName: string | null;
  onSelect: (chordName: string, voicing?: ChordVoicing) => void;
  onClear: () => void;
  onRootChange?: (root: Root) => void;
}

const QUALITY_COLORS: Record<Quality, { active: string; idle: string }> = {
  major: {
    active: "bg-gradient-to-r from-blue-600 to-blue-700 ring-2 ring-blue-300",
    idle: "bg-gradient-to-r from-blue-500/60 to-blue-600/60 hover:from-blue-500 hover:to-blue-600",
  },
  minor: {
    active: "bg-gradient-to-r from-purple-600 to-purple-700 ring-2 ring-purple-300",
    idle: "bg-gradient-to-r from-purple-500/60 to-purple-600/60 hover:from-purple-500 hover:to-purple-600",
  },
  "7": {
    active: "bg-gradient-to-r from-amber-600 to-amber-700 ring-2 ring-amber-300",
    idle: "bg-gradient-to-r from-amber-500/60 to-amber-600/60 hover:from-amber-500 hover:to-amber-600",
  },
  maj7: {
    active: "bg-gradient-to-r from-rose-600 to-rose-700 ring-2 ring-rose-300",
    idle: "bg-gradient-to-r from-rose-500/60 to-rose-600/60 hover:from-rose-500 hover:to-rose-600",
  },
  m7: {
    active: "bg-gradient-to-r from-teal-600 to-teal-700 ring-2 ring-teal-300",
    idle: "bg-gradient-to-r from-teal-500/60 to-teal-600/60 hover:from-teal-500 hover:to-teal-600",
  },
  "6": {
    active: "bg-gradient-to-r from-lime-600 to-lime-700 ring-2 ring-lime-300",
    idle: "bg-gradient-to-r from-lime-500/60 to-lime-600/60 hover:from-lime-500 hover:to-lime-600",
  },
  m6: {
    active: "bg-gradient-to-r from-emerald-600 to-emerald-700 ring-2 ring-emerald-300",
    idle: "bg-gradient-to-r from-emerald-500/60 to-emerald-600/60 hover:from-emerald-500 hover:to-emerald-600",
  },
  dim: {
    active: "bg-gradient-to-r from-zinc-600 to-zinc-700 ring-2 ring-zinc-300",
    idle: "bg-gradient-to-r from-zinc-500/60 to-zinc-600/60 hover:from-zinc-500 hover:to-zinc-600",
  },
  dim7: {
    active: "bg-gradient-to-r from-stone-600 to-stone-700 ring-2 ring-stone-300",
    idle: "bg-gradient-to-r from-stone-500/60 to-stone-600/60 hover:from-stone-500 hover:to-stone-600",
  },
  aug: {
    active: "bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 ring-2 ring-fuchsia-300",
    idle: "bg-gradient-to-r from-fuchsia-500/60 to-fuchsia-600/60 hover:from-fuchsia-500 hover:to-fuchsia-600",
  },
  sus4: {
    active: "bg-gradient-to-r from-orange-600 to-orange-700 ring-2 ring-orange-300",
    idle: "bg-gradient-to-r from-orange-500/60 to-orange-600/60 hover:from-orange-500 hover:to-orange-600",
  },
  sus2: {
    active: "bg-gradient-to-r from-cyan-600 to-cyan-700 ring-2 ring-cyan-300",
    idle: "bg-gradient-to-r from-cyan-500/60 to-cyan-600/60 hover:from-cyan-500 hover:to-cyan-600",
  },
};

export default function ChordSelector({ selectedChordName, onSelect, onClear, onRootChange }: ChordSelectorProps) {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<ChordSelection>({
    root: "C",
    quality: "major",
    tension: null,
  });
  const [showTensions, setShowTensions] = useState(false);
  const [voicings, setVoicings] = useState<ChordVoicing[]>([]);
  const [activeVoicingId, setActiveVoicingId] = useState<string>("open");

  const emitSelection = useCallback(
    (next: ChordSelection, preferVoicingId?: string) => {
      const name = buildChordName(next);
      const allVoicings = resolveChordVoicings(next);
      setVoicings(allVoicings);

      const picked =
        allVoicings.find(v => v.id === (preferVoicingId ?? activeVoicingId))
        ?? allVoicings[0];

      if (picked) {
        setActiveVoicingId(picked.id);
        onSelect(name, picked);
      } else {
        onSelect(name);
      }
    },
    [onSelect, activeVoicingId],
  );

  const handleRoot = (root: Root) => {
    const next: ChordSelection = { ...selection, root, tension: null };
    setSelection(next);
    setShowTensions(false);
    emitSelection(next);
    onRootChange?.(root);
  };

  const handleQuality = (quality: Quality) => {
    const next: ChordSelection = { ...selection, quality, tension: null };
    setSelection(next);
    setShowTensions(false);
    emitSelection(next);
  };

  const handleTension = (t: Tension) => {
    const newTension = selection.tension === t ? null : t;
    const next: ChordSelection = { ...selection, tension: newTension };
    setSelection(next);
    emitSelection(next);
  };

  const handleVoicing = (voicing: ChordVoicing) => {
    setActiveVoicingId(voicing.id);
    const name = buildChordName(selection);
    onSelect(name, voicing);
  };

  const handleClear = () => {
    setSelection({ root: "C", quality: "major", tension: null });
    setShowTensions(false);
    setVoicings([]);
    setActiveVoicingId("open");
    onClear();
  };

  const hasFingeringData = hasFingering(selection);
  const chordTones = buildChordNotes(selection.root, selection.quality, selection.tension);
  const tensionsAvailable = canAddTensions(selection.root, selection.quality);

  return (
    <div className="space-y-3">
      {/* Step 1 — Root */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">1</span>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            {t("chord.rootNote")}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
          {ALL_ROOTS.map(root => {
            const isActive = selectedChordName !== null && selection.root === root;
            return (
              <button
                key={root}
                className={`px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm font-bold rounded-md shadow-md transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white ring-2 ring-blue-300 scale-105"
                    : "bg-gray-700/80 text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => handleRoot(root)}
              >
                {root}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Quality */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">2</span>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            {t("chord.chordType")}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {ALL_QUALITIES.map(quality => {
            const isActive = selectedChordName !== null && selection.quality === quality;
            const colors = QUALITY_COLORS[quality];

            return (
              <button
                key={quality}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold rounded-md shadow-md transition-all duration-200 ${
                  isActive
                    ? `text-white scale-105 ${colors.active}`
                    : `text-gray-200 ${colors.idle}`
                }`}
                onClick={() => handleQuality(quality)}
              >
                {QUALITY_LABELS[quality]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tension — optional */}
      <div className="border-t border-gray-700/50 pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              {t("chord.tension")}
            </span>
            <span className="text-[10px] text-gray-600 italic">{t("chord.optional")}</span>
          </div>
          <button
            disabled={!tensionsAvailable}
            className={`text-xs font-semibold px-2 py-0.5 rounded transition ${
              !tensionsAvailable
                ? "text-gray-600 cursor-not-allowed"
                : showTensions
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-green-400 hover:text-green-300"
            }`}
            onClick={() => tensionsAvailable && setShowTensions(prev => !prev)}
          >
            {showTensions ? t("chord.hide") : t("chord.add")}
          </button>
        </div>

        {showTensions && tensionsAvailable && (
          <div className="flex flex-wrap gap-1.5">
            {ALL_TENSIONS.map(t => {
              const isActive = selection.tension === t;
              return (
                <button
                  key={t}
                  className={`px-2.5 py-1 text-sm font-bold rounded-md shadow-md transition-all duration-200 border ${
                    isActive
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400 scale-105"
                      : "bg-gray-700/80 text-gray-300 border-gray-600/50 hover:bg-gray-600"
                  }`}
                  onClick={() => handleTension(t)}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Result — chord name + notes */}
      {selectedChordName && (
        <div className="border-t border-gray-700/50 pt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <div
              className={`px-3 py-1.5 rounded-lg text-base font-bold ${
                hasFingeringData
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {buildChordName(selection)}
              {!hasFingeringData && (
                <span className="ml-1.5 text-[10px] font-normal text-gray-500">
                  {t("chord.noFingering")}
                </span>
              )}
            </div>
            <button
              className="text-red-400 text-xs font-medium transition px-2 py-1 rounded hover:bg-gray-800/50"
              onClick={handleClear}
            >
              {t("chord.reset")}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
              {t("chord.notes")}
            </span>
            {chordTones.map((note, i) => (
              <span
                key={`${note}-${i}`}
                className="px-1.5 py-0.5 bg-gray-700/60 text-gray-200 text-[11px] font-bold rounded"
              >
                {note}
              </span>
            ))}
          </div>

          {voicings.length === 0 && (
            <div className="text-amber-400/90 text-xs font-medium bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
              {t("chord.noVoicingData")}
            </div>
          )}
        </div>
      )}

      {/* Voicing selector — show even when only one voicing so user sees what it is */}
      {selectedChordName && voicings.length >= 1 && (
        <div>
          <div className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
            {t("chord.voicing")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {voicings.map(v => {
              const isActive = v.id === activeVoicingId;
              return (
                <button
                  key={v.id}
                  className={`px-3 py-1.5 text-sm font-bold rounded-md shadow-md transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white ring-2 ring-indigo-300 scale-105"
                      : "bg-gray-700/80 text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => handleVoicing(v)}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

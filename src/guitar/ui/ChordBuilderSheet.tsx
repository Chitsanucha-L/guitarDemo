import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ALL_ROOTS,
  ALL_QUALITIES,
  ALL_TENSIONS,
  QUALITY_LABELS,
  buildChordName,
  type Root,
  type Quality,
  type Tension,
  type ChordSelection,
} from "../types/chord";
import { canAddTensions, resolveChordVoicings } from "../data/chordLibrary";
import type { ChordVoicing } from "../data/chordLibrary";

const QUALITY_COLORS: Record<Quality, string> = {
  major: "from-blue-600 to-blue-700 ring-blue-300",
  minor: "from-purple-600 to-purple-700 ring-purple-300",
  "7": "from-amber-600 to-amber-700 ring-amber-300",
  maj7: "from-rose-600 to-rose-700 ring-rose-300",
  m7: "from-teal-600 to-teal-700 ring-teal-300",
  "6": "from-lime-600 to-lime-700 ring-lime-300",
  m6: "from-emerald-600 to-emerald-700 ring-emerald-300",
  dim: "from-zinc-600 to-zinc-700 ring-zinc-300",
  dim7: "from-stone-600 to-stone-700 ring-stone-300",
  aug: "from-fuchsia-600 to-fuchsia-700 ring-fuchsia-300",
  sus4: "from-orange-600 to-orange-700 ring-orange-300",
  sus2: "from-cyan-600 to-cyan-700 ring-cyan-300",
};

interface ChordBuilderSheetProps {
  selectedChordName: string | null;
  onSelect: (chordName: string, voicing?: ChordVoicing) => void;
  onClear: () => void;
  onRootChange?: (root: Root) => void;
}

export default function ChordBuilderSheet({
  selectedChordName,
  onSelect,
  onClear,
  onRootChange,
}: ChordBuilderSheetProps) {
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
        allVoicings.find((v) => v.id === (preferVoicingId ?? activeVoicingId)) ??
        allVoicings[0];
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
    onSelect(buildChordName(selection), voicing);
  };

  const handleClear = () => {
    setSelection({ root: "C", quality: "major", tension: null });
    setShowTensions(false);
    setVoicings([]);
    setActiveVoicingId("open");
    onClear();
  };

  const tensionsAvailable = canAddTensions(selection.root, selection.quality);

  return (
    <div className="px-2 space-y-2">
      {/* Step 1: Root — horizontal scroll */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
            1
          </span>
          <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
            {t("chord.rootNote")}
          </span>
        </div>
        <div
          className="flex gap-1.5 overflow-x-auto overscroll-x-contain p-1 -mx-1 scrollbar-none"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {ALL_ROOTS.map((root) => {
            const isActive =
              selectedChordName !== null && selection.root === root;
            return (
              <button
                key={root}
                type="button"
                className={`shrink-0 min-h-[36px] flex items-center justify-center px-2.5 rounded-xl text-[12px] font-bold shadow-lg transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? "bg-blue-600 text-white ring-2 ring-blue-300"
                    : "bg-gray-700/90 text-gray-200 hover:bg-gray-600"
                }`}
                onClick={() => handleRoot(root)}
              >
                {root}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Chord type — grid/pills */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
            2
          </span>
          <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
            {t("chord.chordType")}
          </span>
        </div>
        {/* Mobile: fit 6 per row to reduce vertical clutter */}
        <div className="grid grid-cols-6 gap-1.5">
          {ALL_QUALITIES.map((quality) => {
            const isActive =
              selectedChordName !== null && selection.quality === quality;
            const colors = QUALITY_COLORS[quality];
            return (
              <button
                key={quality}
                type="button"
                className={`min-h-[36px] flex items-center justify-center rounded-xl text-[12px] font-bold shadow-md transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? `bg-gradient-to-r ${colors} text-white ring-2 ring-inset scale-[1.02] brightness-110`
                    : `bg-gradient-to-r ${colors} text-white ring-1 ring-inset brightness-75 hover:brightness-95`
                }`}
                onClick={() => handleQuality(quality)}
              >
                {QUALITY_LABELS[quality]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Tension — collapsible */}
      <div className="border-t border-gray-700/50 pt-2">
        <button
          type="button"
          disabled={!tensionsAvailable}
          className="flex w-full items-center justify-between rounded-xl py-1.5 min-h-[36px] touch-manipulation disabled:opacity-50"
          onClick={() => tensionsAvailable && setShowTensions((p) => !p)}
        >
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
              3
            </span>
            <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
              {t("chord.tension")}
            </span>
            <span className="text-[9px] text-gray-500 italic">
              {t("chord.optional")}
            </span>
          </div>
          <span
            className={`text-xs text-gray-400 font-medium transition-transform ${
              showTensions ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
        {showTensions && tensionsAvailable && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {ALL_TENSIONS.map((t) => {
              const isActive = selection.tension === t;
              return (
                <button
                  key={t}
                  type="button"
                  className={`min-h-[36px] px-3 rounded-xl text-[12px] font-bold shadow-md transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-400"
                      : "bg-gray-700/80 text-gray-200 hover:bg-gray-600"
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

      {/* Voicing selector (compact) */}
      {selectedChordName && voicings.length > 1 && (
        <div>
          <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
            {t("chord.voicing")}
          </span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {voicings.map((v) => {
              const isActive = v.id === activeVoicingId;
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`min-h-[36px] px-2 rounded-xl text-[12px] font-bold transition-all active:scale-[0.98] ${
                    isActive
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                      : "bg-gray-700/80 text-gray-200"
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

      {/* Reset */}
      {selectedChordName && (
        <div className="flex justify-center">
          <button
            type="button"
            className="text-sm text-red-400 transition px-3 py-1 rounded-xl"
            onClick={handleClear}
          >
            {t("chord.reset")}
          </button>
        </div>
      )}
    </div>
  );
}

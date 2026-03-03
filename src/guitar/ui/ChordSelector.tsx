import { useState, useCallback } from "react";
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
}

const QUALITY_COLORS: Record<Quality, { active: string; idle: string }> = {
  major: {
    active: "bg-gradient-to-r from-blue-600 to-blue-700 ring-2 ring-blue-300",
    idle: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
  },
  minor: {
    active: "bg-gradient-to-r from-purple-600 to-purple-700 ring-2 ring-purple-300",
    idle: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
  },
  "7": {
    active: "bg-gradient-to-r from-amber-600 to-amber-700 ring-2 ring-amber-300",
    idle: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
  },
  maj7: {
    active: "bg-gradient-to-r from-rose-600 to-rose-700 ring-2 ring-rose-300",
    idle: "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700",
  },
  m7: {
    active: "bg-gradient-to-r from-teal-600 to-teal-700 ring-2 ring-teal-300",
    idle: "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
  },
  "6": {
    active: "bg-gradient-to-r from-lime-600 to-lime-700 ring-2 ring-lime-300",
    idle: "bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700",
  },
  m6: {
    active: "bg-gradient-to-r from-emerald-600 to-emerald-700 ring-2 ring-emerald-300",
    idle: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
  },
  dim: {
    active: "bg-gradient-to-r from-zinc-600 to-zinc-700 ring-2 ring-zinc-300",
    idle: "bg-gradient-to-r from-zinc-500 to-zinc-600 hover:from-zinc-600 hover:to-zinc-700",
  },
  dim7: {
    active: "bg-gradient-to-r from-stone-600 to-stone-700 ring-2 ring-stone-300",
    idle: "bg-gradient-to-r from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700",
  },
  aug: {
    active: "bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 ring-2 ring-fuchsia-300",
    idle: "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700",
  },
  sus4: {
    active: "bg-gradient-to-r from-orange-600 to-orange-700 ring-2 ring-orange-300",
    idle: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
  },
  sus2: {
    active: "bg-gradient-to-r from-cyan-600 to-cyan-700 ring-2 ring-cyan-300",
    idle: "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700",
  },
};

export default function ChordSelector({ selectedChordName, onSelect, onClear }: ChordSelectorProps) {
  const [selection, setSelection] = useState<ChordSelection>({
    root: "C",
    quality: "major",
    tensions: [],
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
    const next: ChordSelection = { ...selection, root, tensions: [] };
    setSelection(next);
    setShowTensions(false);
    emitSelection(next);
  };

  const handleQuality = (quality: Quality) => {
    const next: ChordSelection = { ...selection, quality, tensions: [] };
    setSelection(next);
    setShowTensions(false);
    emitSelection(next);
  };

  const handleTension = (tension: Tension) => {
    const newTensions = selection.tensions.includes(tension)
      ? selection.tensions.filter(t => t !== tension)
      : [...selection.tensions, tension];
    const next: ChordSelection = { ...selection, tensions: newTensions };
    setSelection(next);
    emitSelection(next);
  };

  const handleVoicing = (voicing: ChordVoicing) => {
    setActiveVoicingId(voicing.id);
    const name = buildChordName(selection);
    onSelect(name, voicing);
  };

  const handleClear = () => {
    setSelection({ root: "C", quality: "major", tensions: [] });
    setShowTensions(false);
    setVoicings([]);
    setActiveVoicingId("open");
    onClear();
  };

  const hasFingeringData = hasFingering(selection);
  const chordTones = buildChordNotes(selection.root, selection.quality, selection.tensions);
  const tensionsAvailable = canAddTensions(selection.root, selection.quality);

  return (
    <div className="mt-4 space-y-3">
      {/* Root */}
      <div>
        <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
          Root
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {ALL_ROOTS.map(root => {
            const isActive = selection.root === root;
            return (
              <button
                key={root}
                className={`px-2 py-1.5 text-sm font-bold rounded-md shadow-md transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white ring-2 ring-blue-300 scale-105"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => handleRoot(root)}
              >
                {root}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality */}
      <div>
        <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
          Quality
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_QUALITIES.map(quality => {
            const isActive = selection.quality === quality;
            const colors = QUALITY_COLORS[quality];

            return (
              <button
                key={quality}
                className={`px-3 py-1.5 text-sm font-bold rounded-md shadow-md transition-all duration-200 ${
                  isActive
                    ? `text-white scale-105 ${colors.active}`
                    : `text-white ${colors.idle}`
                }`}
                onClick={() => handleQuality(quality)}
              >
                {QUALITY_LABELS[quality]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tension panel */}
      <div>
        <button
          disabled={!tensionsAvailable}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md shadow-md transition ${
            !tensionsAvailable
              ? "bg-gray-800 text-gray-600 cursor-not-allowed opacity-40"
              : showTensions
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
          }`}
          onClick={() => tensionsAvailable && setShowTensions(prev => !prev)}
        >
          {showTensions ? "− Hide Tensions" : "+ Add Tension"}
        </button>

        {showTensions && tensionsAvailable && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ALL_TENSIONS.map(tension => {
              const isActive = selection.tensions.includes(tension);

              return (
                <button
                  key={tension}
                  className={`px-2.5 py-1 text-sm font-bold rounded-md shadow-md transition-all duration-200 border-2 ${
                    isActive
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-300 scale-105"
                      : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
                  }`}
                  onClick={() => handleTension(tension)}
                >
                  {tension}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chord name + notes + status */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          {selectedChordName && (
            <div
              className={`px-4 py-2 rounded-lg text-lg font-bold ${
                hasFingeringData
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {buildChordName(selection)}
              {!hasFingeringData && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (no fingering)
                </span>
              )}
            </div>
          )}
          <button
            className="px-4 py-2 bg-red-600 text-white text-[16px] font-medium rounded-md hover:bg-red-500 transition"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>

        {selectedChordName && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Notes:
            </span>
            {chordTones.map((note, i) => (
              <span
                key={`${note}-${i}`}
                className="px-2 py-0.5 bg-gray-700 text-gray-200 text-xs font-bold rounded"
              >
                {note}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Voicing selector */}
      {selectedChordName && voicings.length > 1 && (
        <div>
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
            Voicing
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
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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

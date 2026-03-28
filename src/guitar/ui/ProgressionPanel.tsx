import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PROGRESSIONS, type ChordProgression } from "../data/chordProgressions";

interface ProgressionPanelProps {
  active: boolean;
  currentIndex: number;
  onSelect: (progression: ChordProgression | null) => void;
  /** When this value changes, clear internal selection state. */
  resetToken?: number;
  /** Chord names transposed to the current root (used for display). */
  transposedChords?: string[];
}

export default function ProgressionPanel({
  active,
  currentIndex,
  onSelect,
  resetToken,
  transposedChords,
}: ProgressionPanelProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ChordProgression | null>(null);

  useEffect(() => {
    if (resetToken === undefined) return;
    setSelected(null);
  }, [resetToken]);

  function handleSelect(prog: ChordProgression) {
    if (selected?.id === prog.id) {
      setSelected(null);
      onSelect(null);
    } else {
      setSelected(prog);
      onSelect(prog);
    }
  }

  function handleClear() {
    setSelected(null);
    onSelect(null);
  }

  return (
    <div className="space-y-2">
      {/* Active indicator */}
      {selected && (
        <div className="flex items-center justify-between">
          <span className="text-amber-400 text-xs font-bold">{selected.label}</span>
          <button
            onClick={handleClear}
            className="text-gray-500 hover:text-red-400 text-xs font-medium transition px-2 py-0.5 rounded hover:bg-gray-800/50"
          >
            {t("progression.clear")}
          </button>
        </div>
      )}

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1">
        {PROGRESSIONS.map(prog => (
          <button
            key={prog.id}
            onClick={() => handleSelect(prog)}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-all duration-150 ${
              selected?.id === prog.id
                ? "bg-amber-600 text-white ring-1 ring-amber-300"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {prog.label}
          </button>
        ))}
      </div>

      {/* Chord timeline */}
      {selected && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          {(transposedChords ?? []).map((chord, i) => {
            const isCurrent = active && i === currentIndex;
            return (
              <div key={`${chord}-${i}`} className="flex items-center">
                <span
                  className={`px-3 py-1 text-[15px] font-bold rounded transition-all duration-200 ${
                    isCurrent
                      ? "bg-amber-500 text-white scale-110 shadow-md shadow-amber-500/40"
                      : i < currentIndex && active
                        ? "bg-gray-700 text-gray-500"
                        : "bg-gray-800 text-gray-300"
                  }`}
                >
                  {chord}
                </span>
                {i < (transposedChords ?? []).length - 1 && (
                  <span className="text-gray-600 text-[12px] mx-1">›</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

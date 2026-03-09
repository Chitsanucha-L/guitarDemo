import { useState, useEffect } from "react";
import type { Root } from "../types/chord";
import { SCALES, getScaleNotes, type ScaleDefinition } from "../data/scales";

const SEMITONES: Record<Root, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4,
  F: 5, "F#": 6, G: 7, "G#": 8,
  A: 9, "A#": 10, B: 11,
};

export interface ScalePosition {
  id: string;
  label: string;
  range: [number, number];
}

const POSITIONS: ScalePosition[] = [
  { id: "full", label: "Full", range: [0, 12] },
  { id: "pos1", label: "Pos 1", range: [0, 4] },
  { id: "pos2", label: "Pos 2", range: [3, 7] },
  { id: "pos3", label: "Pos 3", range: [5, 9] },
  { id: "pos4", label: "Pos 4", range: [7, 11] },
];

interface ScaleSelectorProps {
  root: Root;
  onScaleChange: (
    scaleNotes: number[] | null,
    rootSemitone: number | null,
    fretRange: [number, number],
  ) => void;
}

export default function ScaleSelector({ root, onScaleChange }: ScaleSelectorProps) {
  const [scale, setScale] = useState<ScaleDefinition | null>(null);
  const [position, setPosition] = useState<ScalePosition>(POSITIONS[0]);

  function emit(s: ScaleDefinition | null, pos: ScalePosition) {
    if (s) {
      onScaleChange(getScaleNotes(root, s), SEMITONES[root], pos.range);
    } else {
      onScaleChange(null, null, pos.range);
    }
  }

  useEffect(() => {
    emit(scale, position);
  }, [root]);

  function handleScale(s: ScaleDefinition) {
    const next = scale?.id === s.id ? null : s;
    setScale(next);
    emit(next, position);
  }

  function handlePosition(pos: ScalePosition) {
    setPosition(pos);
    emit(scale, pos);
  }

  function handleClear() {
    setScale(null);
    setPosition(POSITIONS[0]);
    emit(null, POSITIONS[0]);
  }

  const label = scale ? `${root} ${scale.label}` : null;

  return (
    <div className="space-y-2">
      {/* Active indicator */}
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-cyan-400 text-xs font-bold">{label}</span>
          <button
            onClick={handleClear}
            className="text-gray-500 hover:text-red-400 text-xs font-medium transition px-2 py-0.5 rounded hover:bg-gray-800/50"
          >
            Clear
          </button>
        </div>
      )}

      {/* Scale type selector */}
      <div className="flex flex-wrap gap-1">
        {SCALES.map(s => (
          <button
            key={s.id}
            onClick={() => handleScale(s)}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-all duration-150 ${
              scale?.id === s.id
                ? "bg-cyan-600 text-white ring-1 ring-cyan-300"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Position selector */}
      {scale && (
        <div className="space-y-1">
          <div className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
            Position
          </div>
          <div className="flex flex-wrap gap-1">
            {POSITIONS.map(pos => (
              <button
                key={pos.id}
                onClick={() => handlePosition(pos)}
                className={`px-2 py-1 text-[11px] font-bold rounded transition-all duration-150 ${
                  position.id === pos.id
                    ? "bg-cyan-700 text-white ring-1 ring-cyan-400"
                    : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                }`}
              >
                {pos.label}
                <span className="text-[9px] font-normal ml-0.5 opacity-60">
                  {pos.range[0]}-{pos.range[1]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {scale && (
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-gray-400 text-[10px]">Root</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 opacity-70" />
            <span className="text-gray-400 text-[10px]">Scale Note</span>
          </div>
        </div>
      )}
    </div>
  );
}

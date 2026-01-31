import type { ChordData } from "../data/types";
import { fingerColors, fingerNames } from "../data/constants";

interface FingerLegendProps {
  highlightChord: ChordData | null;
}

export default function FingerLegend({ highlightChord }: FingerLegendProps) {
  if (!highlightChord) return null;

  return (
    <div className="absolute bottom-5 right-5 z-50 bg-black bg-opacity-60 text-white p-3 rounded pointer-events-auto">
      {Object.entries(highlightChord.notes).map(([note, { finger, fret }]) => {
        if (!finger || fret === 0) return null;
        return (
          <div key={note} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: fingerColors[finger] }} />
            <span>{note}: {fingerNames[finger]}</span>
          </div>
        );
      })}
    </div>
  );
}

import type { ChordData, Finger } from "../data/types";
import { fingerColors, fingerNames } from "../data/constants";

const STRING_LABELS: Record<string, string> = {
  E6: "สาย 6 (E)",
  A: "สาย 5 (A)",
  D: "สาย 4 (D)",
  G: "สาย 3 (G)",
  B: "สาย 2 (B)",
  e1: "สาย 1 (E)",
};

interface FingerLegendProps {
  highlightChord: ChordData | null;
}

export default function FingerLegend({ highlightChord }: FingerLegendProps) {
  if (!highlightChord) return null;

  const barre = highlightChord._barre;
  const barreFinger = barre?.finger;

  const grouped = new Map<Finger, { notes: string[]; fret: number }>();

  Object.entries(highlightChord.notes).forEach(([note, { finger, fret }]) => {
    if (!finger || fret <= 0) return;
    if (barreFinger && finger === barreFinger && fret === barre!.fret) return;

    if (!grouped.has(finger)) {
      grouped.set(finger, { notes: [], fret });
    }
    grouped.get(finger)!.notes.push(STRING_LABELS[note] ?? note);
  });

  const sortedFingers = [...grouped.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="absolute bottom-5 right-5 z-50 bg-black/60 text-white text-sm p-3 rounded-lg pointer-events-auto space-y-1.5">
      {barre && (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: fingerColors[barre.finger] }} />
          <span>{fingerNames[barre.finger]} → บาร์เร่ เฟรต {barre.fret}</span>
        </div>
      )}
      {sortedFingers.map(([finger, { notes, fret }]) => (
        <div key={finger} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: fingerColors[finger] }} />
          <span>{fingerNames[finger]} → {notes.join(", ")} เฟรต {fret}</span>
        </div>
      ))}
    </div>
  );
}

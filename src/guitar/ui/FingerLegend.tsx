import { useTranslation } from "react-i18next";
import type { ChordData, Finger } from "../data/types";
import { fingerColors } from "../data/constants";

const STRING_KEYS: Record<string, string> = {
  E6: "finger.string6",
  A: "finger.string5",
  D: "finger.string4",
  G: "finger.string3",
  B: "finger.string2",
  e1: "finger.string1",
};

interface FingerLegendProps {
  highlightChord: ChordData | null;
  inline?: boolean;
}

export default function FingerLegend({ highlightChord, inline = false }: FingerLegendProps) {
  const { t } = useTranslation();

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
    const label = STRING_KEYS[note] ? t(STRING_KEYS[note]) : note;
    grouped.get(finger)!.notes.push(label);
  });

  const sortedFingers = [...grouped.entries()].sort(([a], [b]) => a - b);

  return (
    <div className={
      inline
        ? "text-white text-[11px] space-y-1"
        : "absolute bottom-3 lg:bottom-5 right-3 lg:right-5 z-50 bg-black/60 text-white text-xs lg:text-sm p-2 lg:p-3 rounded-lg pointer-events-auto space-y-1 lg:space-y-1.5 max-w-[50vw]"
    }>
      {barre && (
        <div className={`flex items-center ${inline ? "gap-1.5" : "gap-2"}`}>
          <span className={`${inline ? "w-2.5 h-2.5" : "w-3 h-3"} rounded-full shrink-0`} style={{ background: fingerColors[barre.finger] }} />
          <span>{t(`finger.${barre.finger}`)} → {t("finger.barreFret", { fret: barre.fret })}</span>
        </div>
      )}
      {sortedFingers.map(([finger, { notes, fret }]) => (
        <div key={finger} className={`flex items-center ${inline ? "gap-1.5" : "gap-2"}`}>
          <span className={`${inline ? "w-2.5 h-2.5" : "w-3 h-3"} rounded-full shrink-0`} style={{ background: fingerColors[finger] }} />
          <span>{t(`finger.${finger}`)} → {notes.join(", ")} {t("finger.fret", { fret })}</span>
        </div>
      ))}
    </div>
  );
}

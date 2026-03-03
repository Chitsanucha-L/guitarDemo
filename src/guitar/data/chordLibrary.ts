import type { ChordData } from "./types";
import { generateFingering, generateFingerings } from "./chordShapes";
import type { ChordVoicing } from "./chordShapes";
import type { ChordSelection, Root, Quality, Tension } from "../types/chord";
import { buildChordName, buildChordNotes } from "../types/chord";

export interface ChordInfo {
  name: string;
  notes: string[];
  fingering: ChordData | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function resolveChordSelection(selection: ChordSelection): ChordData | null {
  const { root, quality, tensions } = selection;

  try {
    const tension = tensions.length > 0
      ? tensions[tensions.length - 1]
      : undefined;
    const result = generateFingering(root, quality, tension);

    console.group(`[Fingering] ${buildChordName(selection)}`);
    console.table(
      Object.fromEntries(
        Object.entries(result.notes).map(([s, d]) => [s, { fret: d.fret, finger: d.finger ?? "-" }]),
      ),
    );
    if (result._barre) console.log("Barre:", result._barre);
    console.groupEnd();

    return result;
  } catch {
    return null;
  }
}

export function hasFingering(selection: ChordSelection): boolean {
  return resolveChordSelection(selection) !== null;
}

export function resolveChordInfo(selection: ChordSelection): ChordInfo {
  return {
    name: buildChordName(selection),
    notes: buildChordNotes(selection.root, selection.quality, selection.tensions),
    fingering: resolveChordSelection(selection),
  };
}

export function isQualityAvailable(_root: Root, _quality: Quality): boolean {
  return true;
}

export function isTensionAvailable(_root: Root, _quality: Quality, _tension: Tension): boolean {
  return true;
}

export function canAddTensions(_root: Root, _quality: Quality): boolean {
  return true;
}

export function resolveChordVoicings(selection: ChordSelection): ChordVoicing[] {
  const { root, quality, tensions } = selection;
  const tension = tensions.length > 0 ? tensions[tensions.length - 1] : undefined;
  return generateFingerings(root, quality, tension);
}

export type { ChordVoicing };

// ---------------------------------------------------------------------------
// Name-based resolver (parses chord name strings)
// ---------------------------------------------------------------------------

const SUFFIX_TO_QUALITY: Record<string, Quality> = {
  "": "major",
  m: "minor",
  "7": "7",
  maj7: "maj7",
  m7: "m7",
  "6": "6",
  m6: "m6",
  dim: "dim",
  dim7: "dim7",
  aug: "aug",
  sus4: "sus4",
  sus2: "sus2",
};

function parseChordName(name: string): ChordSelection | null {
  let tensions: Tension[] = [];
  let baseName = name;

  const tensionMatch = name.match(/\((.+)\)$/);
  if (tensionMatch) {
    baseName = name.slice(0, tensionMatch.index);
    tensions = tensionMatch[1].split(",") as Tension[];
  }

  let root: Root;
  let qualitySuffix: string;

  if (baseName.length >= 2 && baseName[1] === "#") {
    root = baseName.slice(0, 2) as Root;
    qualitySuffix = baseName.slice(2);
  } else {
    root = baseName[0] as Root;
    qualitySuffix = baseName.slice(1);
  }

  const quality = SUFFIX_TO_QUALITY[qualitySuffix];
  if (!quality) return null;

  return { root, quality, tensions };
}

export function resolveChordByName(name: string): ChordData | null {
  const selection = parseChordName(name);
  if (!selection) return null;

  return resolveChordSelection(selection);
}

export function resolveChordNotesByName(name: string): string[] {
  const selection = parseChordName(name);
  if (!selection) return [];
  return buildChordNotes(selection.root, selection.quality, selection.tensions);
}

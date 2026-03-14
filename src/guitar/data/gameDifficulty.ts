import type { ChordData } from "./types";
import type { Root, Quality } from "../types/chord";
import { ALL_ROOTS, ALL_QUALITIES, ALL_TENSIONS } from "../types/chord";
import { OVERRIDES, generateFingering, hasOverride } from "./chordShapes";

export type GameDifficulty = "easy" | "medium" | "hard" | "veryHard";

export interface GameChordEntry {
  name: string;
  data: ChordData;
}

function overrideKey(root: Root, quality: Quality, tension?: string): string {
  const suffixMap: Record<Quality, string> = {
    major: "",
    minor: "m",
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
  return root + suffixMap[quality] + (tension ?? "");
}

function isPlayableChord(data: ChordData): boolean {
  let n = 0;
  for (const note of Object.values(data.notes)) {
    if (note.fret >= 0) n++;
  }
  return n >= 2;
}

/** Open major + minor only (no barre shapes). */
const EASY_CHORDS: GameChordEntry[] = [
  { name: "C", data: OVERRIDES.C },
  { name: "G", data: OVERRIDES.G },
  { name: "D", data: OVERRIDES.D },
  { name: "A", data: OVERRIDES.A },
  { name: "E", data: OVERRIDES.E },
  { name: "Am", data: OVERRIDES.Am },
  { name: "Em", data: OVERRIDES.Em },
  { name: "Dm", data: OVERRIDES.Dm },
];

/**
 * Easy + open-barre F & Bm + major/minor for every sharp root and B
 * (C#, D#, F#, G#, A#, B) so Medium practices barre shapes on all “black key” roots.
 */
function buildMediumPool(): GameChordEntry[] {
  const seen = new Set<string>();
  const out: GameChordEntry[] = [];

  for (const c of EASY_CHORDS) {
    seen.add(c.name);
    out.push(c);
  }
  seen.add("F");
  out.push({ name: "F", data: OVERRIDES.F });
  seen.add("Bm");
  out.push({ name: "Bm", data: OVERRIDES.Bm });

  const barreRoots: Root[] = ["C#", "D#", "F#", "G#", "A#", "B"];
  for (const root of barreRoots) {
    for (const quality of ["major", "minor"] as Quality[]) {
      const name = overrideKey(root, quality);
      if (seen.has(name)) continue;
      const data = generateFingering(root, quality);
      if (!isPlayableChord(data)) continue;
      seen.add(name);
      out.push({ name, data });
    }
  }
  return out;
}

const MEDIUM_CHORDS: GameChordEntry[] = buildMediumPool();

let hardPoolCache: GameChordEntry[] | null = null;
let veryHardPoolCache: GameChordEntry[] | null = null;

function buildHardPool(): GameChordEntry[] {
  const seen = new Set<string>();
  const out: GameChordEntry[] = [];

  for (const root of ALL_ROOTS) {
    for (const quality of ALL_QUALITIES) {
      const data = generateFingering(root, quality);
      if (!isPlayableChord(data)) continue;
      const name = overrideKey(root, quality);
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ name, data });
    }
  }
  return out;
}

function buildVeryHardPool(): GameChordEntry[] {
  const hard = buildHardPool();
  const seen = new Set(hard.map((c) => c.name));
  const out = [...hard];

  for (const root of ALL_ROOTS) {
    for (const quality of ALL_QUALITIES) {
      for (const tension of ALL_TENSIONS) {
        if (!hasOverride(root, quality, tension)) continue;
        const name = overrideKey(root, quality, tension);
        if (seen.has(name)) continue;
        seen.add(name);
        const key = name as keyof typeof OVERRIDES;
        const data = OVERRIDES[key];
        if (data && isPlayableChord(data)) {
          out.push({ name, data });
        }
      }
    }
  }
  return out;
}

export function getGameChordPool(difficulty: GameDifficulty): GameChordEntry[] {
  switch (difficulty) {
    case "easy":
      return EASY_CHORDS;
    case "medium":
      return MEDIUM_CHORDS;
    case "hard":
      if (!hardPoolCache) hardPoolCache = buildHardPool();
      return hardPoolCache;
    case "veryHard":
      if (!veryHardPoolCache) veryHardPoolCache = buildVeryHardPool();
      return veryHardPoolCache;
    default:
      return MEDIUM_CHORDS;
  }
}

/** Legacy pool — same as medium. */
export const GAME_CHORDS_MEDIUM = MEDIUM_CHORDS;

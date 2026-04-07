import type { ChordData } from "./types";
import type { Root, Quality } from "../types/chord";
import { ALL_ROOTS, ALL_QUALITIES, ALL_TENSIONS } from "../types/chord";
import { OVERRIDES, generateFingering, generateFingerings, hasOverride } from "./chordShapes";

export type GameDifficulty = "easy" | "medium" | "hard" | "veryHard";

export interface GameChordEntry {
  name: string;
  data: ChordData;
  root: Root;
  quality: Quality;
  tension?: string;
}

/** All playable voicings for a game chord (cached per chord entry). */
const allVoicingsCache = new WeakMap<GameChordEntry, ChordData[]>();

export function getAllVoicings(entry: GameChordEntry): ChordData[] {
  const cached = allVoicingsCache.get(entry);
  if (cached) return cached;
  const voicings = generateFingerings(entry.root, entry.quality, entry.tension)
    .map((v) => v.data);
  if (voicings.length === 0) voicings.push(entry.data);
  allVoicingsCache.set(entry, voicings);
  return voicings;
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
  { name: "C", data: OVERRIDES.C, root: "C", quality: "major" },
  { name: "G", data: OVERRIDES.G, root: "G", quality: "major" },
  { name: "D", data: OVERRIDES.D, root: "D", quality: "major" },
  { name: "A", data: OVERRIDES.A, root: "A", quality: "major" },
  { name: "E", data: OVERRIDES.E, root: "E", quality: "major" },
  { name: "Am", data: OVERRIDES.Am, root: "A", quality: "minor" },
  { name: "Em", data: OVERRIDES.Em, root: "E", quality: "minor" },
  { name: "Dm", data: OVERRIDES.Dm, root: "D", quality: "minor" },
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
  out.push({ name: "F", data: OVERRIDES.F, root: "F", quality: "major" });
  seen.add("Bm");
  out.push({ name: "Bm", data: OVERRIDES.Bm, root: "B", quality: "minor" });

  const barreRoots: Root[] = ["C#", "D#", "F#", "G#", "A#", "B"];
  for (const root of barreRoots) {
    for (const quality of ["major", "minor"] as Quality[]) {
      const name = overrideKey(root, quality);
      if (seen.has(name)) continue;
      const data = generateFingering(root, quality);
      if (!isPlayableChord(data)) continue;
      seen.add(name);
      out.push({ name, data, root, quality });
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
      out.push({ name, data, root, quality });
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
          out.push({ name, data, root, quality, tension });
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

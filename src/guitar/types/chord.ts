export type Root =
  | "C" | "C#" | "D" | "D#" | "E"
  | "F" | "F#" | "G" | "G#"
  | "A" | "A#" | "B";

export type Quality =
  | "major"
  | "minor"
  | "7"
  | "maj7"
  | "m7"
  | "6"
  | "m6"
  | "dim"
  | "dim7"
  | "aug"
  | "sus4"
  | "sus2";

export type Tension =
  | "add9"
  | "add11"
  | "add13"
  | "9"
  | "11"
  | "13"
  | "b9"
  | "#9"
  | "#11"
  | "b13";

export interface ChordSelection {
  root: Root;
  quality: Quality;
  tensions: Tension[];
}

export const ALL_ROOTS: Root[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

export const ALL_QUALITIES: Quality[] = [
  "major", "minor", "7", "maj7", "m7", "6", "m6", "dim", "dim7", "aug", "sus4", "sus2",
];

export const ALL_TENSIONS: Tension[] = [
  "add9", "add11", "add13", "9", "11", "13", "b9", "#9", "#11", "b13",
];

export const QUALITY_LABELS: Record<Quality, string> = {
  major: "Major",
  minor: "Minor",
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

const QUALITY_SUFFIX: Record<Quality, string> = {
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

export function buildChordName(selection: ChordSelection): string {
  const { root, quality, tensions } = selection;
  let name = root + QUALITY_SUFFIX[quality];
  if (tensions.length > 0) {
    name += `(${tensions.join(",")})`;
  }
  return name;
}

// ---------------------------------------------------------------------------
// Formula-based chord tone generator
// ---------------------------------------------------------------------------

const CHROMATIC = [
  "C", "C#", "D", "D#", "E",
  "F", "F#", "G", "G#",
  "A", "A#", "B",
] as const;

const QUALITY_INTERVALS: Record<Quality, number[]> = {
  major:  [0, 4, 7],
  minor:  [0, 3, 7],
  "7":    [0, 4, 7, 10],
  maj7:   [0, 4, 7, 11],
  m7:     [0, 3, 7, 10],
  "6":    [0, 4, 7, 9],
  m6:     [0, 3, 7, 9],
  dim:    [0, 3, 6],
  dim7:   [0, 3, 6, 9],
  aug:    [0, 4, 8],
  sus2:   [0, 2, 7],
  sus4:   [0, 5, 7],
};

const TENSION_INTERVALS: Record<Tension, number> = {
  add9: 2,  "9": 2,
  add11: 5, "11": 5,
  add13: 9, "13": 9,
  b9: 1,    "#9": 3,
  "#11": 6, b13: 8,
};

export function buildChordNotes(
  root: Root,
  quality: Quality,
  tensions: Tension[] = [],
): string[] {
  const rootIndex = CHROMATIC.indexOf(root);
  const intervals = [...QUALITY_INTERVALS[quality]];

  for (const t of tensions) {
    const interval = TENSION_INTERVALS[t];
    if (!intervals.includes(interval)) {
      intervals.push(interval);
    }
  }

  intervals.sort((a, b) => a - b);
  return intervals.map(i => CHROMATIC[(rootIndex + i) % 12]);
}

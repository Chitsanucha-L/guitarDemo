import type { Root } from "../types/chord";

export interface ChordDegree {
  semitones: number;
  quality: "major" | "minor";
}

export interface ChordProgression {
  id: string;
  label: string;
  degrees: ChordDegree[];
}

const CHROMATIC: Root[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const QUALITY_SUFFIX: Record<ChordDegree["quality"], string> = {
  major: "",
  minor: "m",
};

export function transposeProgression(degrees: ChordDegree[], root: Root): string[] {
  const rootIdx = CHROMATIC.indexOf(root);
  return degrees.map((d) => {
    const noteIdx = (rootIdx + d.semitones) % 12;
    return CHROMATIC[noteIdx] + QUALITY_SUFFIX[d.quality];
  });
}

// Degrees follow major-key diatonic harmony:
//   I=0  ii=2  iii=4  IV=5  V=7  vi=9  vii°=11
const I   = { semitones: 0,  quality: "major" } as const;
const IV  = { semitones: 5,  quality: "major" } as const;
const V   = { semitones: 7,  quality: "major" } as const;
const vi  = { semitones: 9,  quality: "minor" } as const;

export const PROGRESSIONS: ChordProgression[] = [
  {
    id: "pop",
    label: "Pop (I V vi IV)",
    degrees: [I, V, vi, IV],
  },
  {
    id: "50s",
    label: "50s (I vi IV V)",
    degrees: [I, vi, IV, V],
  },
  {
    id: "axis",
    label: "Axis (vi IV I V)",
    degrees: [vi, IV, I, V],
  },
  {
    id: "sad",
    label: "Sad (i VI III VII)",
    degrees: [vi, IV, I, V],
  },
  {
    id: "country",
    label: "Country (I IV V I)",
    degrees: [I, IV, V, I],
  },
  {
    id: "blues12",
    label: "12 Bar Blues",
    degrees: [I, I, I, I, IV, IV, I, I, V, IV, I, V],
  },
];

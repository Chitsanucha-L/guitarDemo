import type { Finger, Note } from "./types";

export const fingerColors: Record<Finger, string> = {
  1: "#db0000",
  2: "#0d2ee2",
  3: "#008d06",
  4: "#ff5722",
};

export const fingerNames: Record<Finger, string> = {
  1: "นิ้วชี้",
  2: "นิ้วกลาง",
  3: "นิ้วนาง",
  4: "นิ้วก้อย",
};

// ---------------------------------------------------------------------------
// Standard tuning & chromatic scale
// ---------------------------------------------------------------------------

export const TUNING = ["E", "A", "D", "G", "B", "E"] as const; // strings 6→1

export const CHROMATIC = [
  "C", "C#", "D", "D#", "E",
  "F", "F#", "G", "G#",
  "A", "A#", "B",
] as const;

const ENHARMONIC: Record<string, string> = {
  Db: "C#", Eb: "D#", Fb: "E", Gb: "F#",
  Ab: "G#", Bb: "A#", Cb: "B",
  "E#": "F", "B#": "C",
};

export function normalizeNote(note: string): string {
  return ENHARMONIC[note] ?? note;
}

/**
 * Compute the note name at a given string + fret position.
 * stringIndex: 0 = string 6 (low E) … 5 = string 1 (high E)
 */
export function getNote(stringIndex: number, fret: number): string {
  const openNote = TUNING[stringIndex];
  const openIdx = CHROMATIC.indexOf(openNote);
  return CHROMATIC[(openIdx + fret) % 12];
}

/** Convert guitar stringNum (1-6) to a 0-based TUNING index. */
export function stringNumToIndex(stringNum: number): number {
  return 6 - stringNum;
}

// ---------------------------------------------------------------------------
// Legacy mappings (still used by audio / interaction hooks for ChordData keys)
// ---------------------------------------------------------------------------

export const stringToNote: Record<number, Note> = {
  6: "E6",
  5: "A",
  4: "D",
  3: "G",
  2: "B",
  1: "e1",
};

// MIDI-based display name (includes octave): e.g. "E2", "A#4"
const MIDI_OPEN: Record<number, number> = {
  1: 64, // E4
  2: 59, // B3
  3: 55, // G3
  4: 50, // D3
  5: 45, // A2
  6: 40, // E2
};

export const getNoteName = (stringNum: number, fret: number): string => {
  const midi = MIDI_OPEN[stringNum] + fret;
  const octave = Math.floor((midi - 12) / 12);
  return `${CHROMATIC[midi % 12]}${octave}`;
};

import type { Root } from "../types/chord";
import type { Note } from "./types";

export interface ScaleDefinition {
  id: string;
  label: string;
  intervals: number[];
}

export const SCALES: ScaleDefinition[] = [
  { id: "major",            label: "Major",            intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "minor",            label: "Minor",            intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "major_pentatonic", label: "Major Pentatonic",  intervals: [0, 2, 4, 7, 9] },
  { id: "minor_pentatonic", label: "Minor Pentatonic",  intervals: [0, 3, 5, 7, 10] },
  { id: "blues",            label: "Blues",             intervals: [0, 3, 5, 6, 7, 10] },
];

const SEMITONES: Record<Root, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4,
  F: 5, "F#": 6, G: 7, "G#": 8,
  A: 9, "A#": 10, B: 11,
};

const STRING_OPEN: Record<Note, number> = {
  E6: 4, A: 9, D: 2, G: 7, B: 11, e1: 4,
};

export function getScaleNotes(root: Root, scale: ScaleDefinition): number[] {
  const rootSemitone = SEMITONES[root];
  return scale.intervals.map(i => (rootSemitone + i) % 12);
}

export function isScaleNote(
  stringName: Note,
  fret: number,
  scaleNotes: number[],
): boolean {
  const note = (STRING_OPEN[stringName] + fret) % 12;
  return scaleNotes.includes(note);
}

import type { ChordData, Note, Finger } from "./types";
import type { Root, Quality } from "../types/chord";

// ---------------------------------------------------------------------------
// Handcrafted open-position chords (preferred over transposition for these)
// ---------------------------------------------------------------------------

const OVERRIDES: Record<string, ChordData> = {
  // ---- Major (open) ----
  C:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  G:  { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 3, finger: 3 } } },
  D:  { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 2, finger: 2 } } },
  A:  { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 2, finger: 4 }, e1: { fret: 0 } } },
  E:  { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } } },
  F:  { notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } }, _barre: { fret: 1, finger: 1, fromString: "E6", toString: "e1" } },

  // ---- Minor (open) ----
  Am: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  Em: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dm: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 1, finger: 1 } } },

  // ---- 7 ----
  C7:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 3, finger: 4 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  G7:  { notes: { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 1, finger: 1 } } },
  D7:  { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 2, finger: 3 } } },
  A7:  { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } } },
  E7:  { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } } },
  F7:  { notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } }, _barre: { fret: 1, finger: 1, fromString: "E6", toString: "e1" } },
  Am7: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  Em7: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dm7: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } }, _barre: { fret: 1, finger: 1, fromString: "B", toString: "e1" } },

  // ---- maj7 ----
  Cmaj7: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Gmaj7: { notes: { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 2, finger: 1 } } },
  Dmaj7: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 2, finger: 2 }, e1: { fret: 2, finger: 3 } } },
  Amaj7: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } } },
  Emaj7: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 1, finger: 1 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } }, _barre: { fret: 1, finger: 1, fromString: "D", toString: "G" } },
  Fmaj7: { notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } }, _barre: { fret: 1, finger: 1, fromString: "E6", toString: "B" } },
  Ammaj7: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } }, _barre: { fret: 1, finger: 1, fromString: "G", toString: "B" } },
  Emmaj7: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 1, finger: 1 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dmmaj7: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 2, finger: 3 }, e1: { fret: 1, finger: 1 } } },

  // ---- sus4 ----
  Csus4: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 4 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 3, finger: 3 } } },
  Gsus4: { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 1, finger: 3 }, e1: { fret: 3, finger: 4 } } },
  Dsus4: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 3, finger: 4 } } },
  Asus4: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 3, finger: 4 }, e1: { fret: 0 } } },
  Esus4: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 2, finger: 4 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Fsus4: { notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 4 }, D: { fret: 3, finger: 3 }, G: { fret: 3, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } }, _barre: { fret: 1, finger: 1, fromString: "E6", toString: "e1" } },
  Amsus4: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 3, finger: 4 }, e1: { fret: 0 } } },
  Emsus4: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dmsus4: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 3, finger: 3 } } },

  // ---- add9 ----
  Cadd9: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 2 }, D: { fret: 2, finger: 1 }, G: { fret: 0 }, B: { fret: 3, finger: 3 }, e1: { fret: 0 } } },
  Gadd9: { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 2, finger: 3 }, B: { fret: 0 }, e1: { fret: 3, finger: 4 } } },
  Dadd9: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 2 }, e1: { fret: 0 } } },
  Aadd9: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 2, finger: 2 }, e1: { fret: 0 } } },
  Eadd9: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 3 }, B: { fret: 0 }, e1: { fret: 2, finger: 4 } } },
  Fadd9: { notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 3, finger: 2 } }, _barre: { fret: 1, finger: 1, fromString: "E6", toString: "B" } },
  Amadd9: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 1, finger: 2 }, e1: { fret: 0 } } },
  Emadd9: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 2, finger: 3 } } },
  Dmadd9: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 2 }, e1: { fret: 0 } } },

  // ---- 6 ----
  C6:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 4 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  A6:  { notes: { E6: { fret: -1 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 2, finger: 4 }, e1: { fret: 2, finger: 1 } } },
  D6:  { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 0 }, e1: { fret: 2, finger: 2 } } },
  "E6":  { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 1, finger: 1 }, B: { fret: 2, finger: 4 }, e1: { fret: 0 } } },
  G6:  { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },

  // ---- dim ----
  Cdim:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 2 }, D: { fret: 4, finger: 3 }, G: { fret: 2, finger: 1 }, B: { fret: 4, finger: 4 }, e1: { fret: -1 } } },

  // ---- dim7 ----
  Cdim7: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 2 }, D: { fret: 4, finger: 3 }, G: { fret: 2, finger: 1 }, B: { fret: 4, finger: 4 }, e1: { fret: 2, finger: 1 } } },

  // ---- aug ----
  Caug:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
};

// ---------------------------------------------------------------------------
// Shape-based transposition system
// ---------------------------------------------------------------------------

interface ChordShape {
  baseSemitone: number;
  rootStringIndex: number;
  frets: (number | null)[];
}

const SEMITONES: Record<Root, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4,
  F: 5, "F#": 6, G: 7, "G#": 8,
  A: 9, "A#": 10, B: 11,
};

const STRING_NAMES: Note[] = ["E6", "A", "D", "G", "B", "e1"];

const STRING_OPEN: Record<Note, number> = {
  E6: 4, A: 9, D: 2, G: 7, B: 11, e1: 4,
};

// ---------------------------------------------------------------------------
// Chord Formula Engine
// ---------------------------------------------------------------------------

const CHORD_FORMULAS: Record<Quality, number[]> = {
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
  sus4:   [0, 5, 7],
  sus2:   [0, 2, 7],
};

const TENSION_INTERVALS: Record<string, number> = {
  add9:  2,
  add11: 5,
  add13: 9,
  "9":   2,
};

export function buildChordIntervals(quality: Quality, tension?: string): number[] {
  const base = [...CHORD_FORMULAS[quality]];

  if (tension) {
    const interval = TENSION_INTERVALS[tension];
    if (interval !== undefined && !base.includes(interval)) {
      base.push(interval);
    }
    if (tension === "9" && !base.includes(10)) {
      base.push(10);
    }
  }

  return base;
}

// Two families per quality: E-shape (root on low E) and A-shape (root on A).
// generateFingering picks whichever gives a lower position on the neck.

const SHAPES: Record<Quality, ChordShape[]> = {
  major: [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 2, 1, 0, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 2, 2, 0] },
  ],
  minor: [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 2, 0, 0, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 2, 1, 0] },
  ],
  "7": [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 0, 1, 0, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 0, 2, 0] },
  ],
  maj7: [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 1, 1, 0, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 1, 2, 0] },
  ],
  m7: [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 0, 0, 0, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 0, 1, 0] },
  ],
  "6": [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 2, 1, 2, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 2, 2, 2] },
  ],
  m6: [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 2, 0, 2, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 1, 2, 2] },
  ],
  dim: [
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 1, 2, 1, null] },
  ],
  dim7: [
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 1, 2, 1, 2] },
  ],
  aug: [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 3, 2, 1, 1, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 3, 2, 2, 1] },
  ],
  sus4: [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 2, 2, 0, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 2, 3, 0] },
  ],
  sus2: [
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 2, 0, 0] },
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 4, 4, 0, 0] },
  ],
};

// ---------------------------------------------------------------------------
// Voicing validation (formula-based)
// ---------------------------------------------------------------------------

function getVoicingIntervals(chord: ChordData, root: Root): Set<number> {
  const rootSemi = SEMITONES[root];
  const intervals = new Set<number>();
  for (const [name, data] of Object.entries(chord.notes)) {
    if (data.fret < 0) continue;
    const semi = (STRING_OPEN[name as Note] + data.fret) % 12;
    intervals.add((semi - rootSemi + 12) % 12);
  }
  return intervals;
}

function validateVoicing(
  chord: ChordData,
  root: Root,
  quality: Quality,
): boolean {
  const actual = getVoicingIntervals(chord, root);

  if (actual.size === 0) return false;

  if (!actual.has(0)) return false;

  const formula = CHORD_FORMULAS[quality];
  const needs3 = formula.includes(3);
  const needs4 = formula.includes(4);
  if (needs3 && actual.has(4) && !actual.has(3)) return false;
  if (needs4 && actual.has(3) && !actual.has(4)) return false;

  return true;
}

function assignFingers(
  playedStrings: { index: number; fret: number }[],
  hasBarre: boolean,
  barreFret: number,
): Map<number, Finger> {
  const fingerMap = new Map<number, Finger>();
  const frettedStrings = playedStrings.filter(s => s.fret > 0);

  if (hasBarre) {
    for (const s of frettedStrings) {
      if (s.fret === barreFret) fingerMap.set(s.index, 1);
    }
    const remaining = frettedStrings
      .filter(s => s.fret > barreFret)
      .sort((a, b) => a.fret - b.fret || a.index - b.index);

    const extra: Finger[] = [2, 3, 4];
    remaining.forEach((s, i) => {
      if (i < extra.length) fingerMap.set(s.index, extra[i]);
    });
  } else {
    const sorted = [...frettedStrings].sort(
      (a, b) => a.fret - b.fret || a.index - b.index,
    );
    const fingers: Finger[] = [1, 2, 3, 4];
    sorted.forEach((s, i) => {
      if (i < fingers.length) fingerMap.set(s.index, fingers[i]);
    });
  }

  return fingerMap;
}

function transposeShape(shape: ChordShape, targetRoot: Root): ChordData {
  const rootString = STRING_NAMES[shape.rootStringIndex];
  const stringOpenSemitone = STRING_OPEN[rootString];
  const offset = (SEMITONES[targetRoot] - stringOpenSemitone + 12) % 12;

  const notes = {} as ChordData["notes"];
  const played: { index: number; fret: number }[] = [];

  for (let i = 0; i < 6; i++) {
    const raw = shape.frets[i];
    if (raw === null) {
      notes[STRING_NAMES[i]] = { fret: -1 };
      continue;
    }
    const fret = raw + offset;
    notes[STRING_NAMES[i]] = { fret };
    if (fret >= 0) played.push({ index: i, fret });
  }

  const minFret = played.length > 0
    ? Math.min(...played.map(s => s.fret))
    : 0;
  const atMin = played.filter(s => s.fret === minFret);
  const hasBarre = offset > 0 && atMin.length >= 2 && minFret > 0;

  const fingerMap = assignFingers(played, hasBarre, minFret);
  for (const [idx, finger] of fingerMap) {
    notes[STRING_NAMES[idx]].finger = finger;
  }

  const result: ChordData = { notes };

  if (hasBarre) {
    const barreIndices = atMin.map(s => s.index);
    result._barre = {
      fret: minFret,
      finger: 1,
      fromString: STRING_NAMES[Math.min(...barreIndices)],
      toString: STRING_NAMES[Math.max(...barreIndices)],
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a lookup key that matches the OVERRIDES table.
 * Examples: ("C","major") → "C", ("A","minor") → "Am", ("C","7") → "C7"
 */
function overrideKey(root: Root, quality: Quality, tension?: string): string {
  const suffixMap: Record<Quality, string> = {
    major: "", minor: "m", "7": "7", maj7: "maj7", m7: "m7",
    "6": "6", m6: "m6", dim: "dim", dim7: "dim7", aug: "aug",
    sus4: "sus4", sus2: "sus2",
  };
  return root + suffixMap[quality] + (tension ?? "");
}

function isSameShape(a: ChordData, b: ChordData): boolean {
  return STRING_NAMES.every(s => a.notes[s].fret === b.notes[s].fret);
}

// ---------------------------------------------------------------------------
// Multi-voicing API
// ---------------------------------------------------------------------------

export interface ChordVoicing {
  id: string;
  label: string;
  data: ChordData;
}

/**
 * Return all available voicings for a chord (open override + transposed shapes).
 * Filters out unplayable results and deduplicates.
 */
export function generateFingerings(
  root: Root,
  quality: Quality,
  tension?: string,
): ChordVoicing[] {
  const result: ChordVoicing[] = [];

  const key = overrideKey(root, quality, tension);

  if (OVERRIDES[key]) {
    result.push({
      id: "open",
      label: "Open",
      data: OVERRIDES[key],
    });
  }

  if (tension) return result;

  const shapes = SHAPES[quality];
  if (!shapes) return result;

  for (const shape of shapes) {
    const chord = transposeShape(shape, root);

    const frets = Object.values(chord.notes).map(n => n.fret);
    const hasPlayable = frets.some(f => f >= 0);
    const maxFret = Math.max(...frets);
    const playableFrets = frets.filter(f => f > 0);
    const minPlayableFret = playableFrets.length > 0 ? Math.min(...playableFrets) : 0;

    if (!hasPlayable) continue;
    if (maxFret > 12) continue;
    if (minPlayableFret > 8) continue;
    if (!validateVoicing(chord, root, quality)) continue;

    const isDuplicate = result.some(v => isSameShape(v.data, chord));
    if (isDuplicate) continue;

    const shapeType = shape.rootStringIndex === 0 ? "e-shape" : "a-shape";
    const label = shape.rootStringIndex === 0 ? "E Shape" : "A Shape";

    result.push({ id: shapeType, label, data: chord });
  }

  return result;
}

/**
 * Resolve a single fingering (backward-compatible).
 * Returns the first available voicing, preferring open overrides.
 */
export function generateFingering(
  root: Root,
  quality: Quality,
  tension?: string,
): ChordData {
  const voicings = generateFingerings(root, quality, tension);

  if (voicings.length > 0) return voicings[0].data;

  return {
    notes: {
      E6: { fret: -1 },
      A: { fret: -1 },
      D: { fret: -1 },
      G: { fret: -1 },
      B: { fret: -1 },
      e1: { fret: -1 },
    },
  };
}

/**
 * Check if a handcrafted override exists for this chord.
 */
export function hasOverride(
  root: Root,
  quality: Quality,
  tension?: string,
): boolean {
  return overrideKey(root, quality, tension) in OVERRIDES;
}

// ---------------------------------------------------------------------------
// Game-mode chord lists (open-position chords suitable for beginners)
// ---------------------------------------------------------------------------

export const GAME_CHORDS: { name: string; data: ChordData }[] = [
  { name: "C",  data: OVERRIDES.C },
  { name: "G",  data: OVERRIDES.G },
  { name: "D",  data: OVERRIDES.D },
  { name: "A",  data: OVERRIDES.A },
  { name: "E",  data: OVERRIDES.E },
  { name: "F",  data: OVERRIDES.F },
  { name: "Am", data: OVERRIDES.Am },
  { name: "Em", data: OVERRIDES.Em },
  { name: "Dm", data: OVERRIDES.Dm },
];

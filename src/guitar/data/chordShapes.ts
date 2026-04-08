import type { ChordData, Note, Finger } from "./types";
import type { Root, Quality } from "../types/chord";

// ---------------------------------------------------------------------------
// Handcrafted open-position chords (preferred over transposition for these)
// ---------------------------------------------------------------------------

export const OVERRIDES: Record<string, ChordData> = {
  // ---- Major (open) ----
  C:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  G:  { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 3, finger: 3 } } },
  D:  { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 2, finger: 2 } } },
  A:  { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 2, finger: 4 }, e1: { fret: 0 } } },
  E:  { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } } },

  // ---- Minor (open) ----
  Am: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  Em: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dm: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 1, finger: 1 } } },
  Bm: { notes: { E6: { fret: -1 }, A: { fret: 2, finger: 1 }, D: { fret: 4, finger: 3 }, G: { fret: 4, finger: 4 }, B: { fret: 3, finger: 2 }, e1: { fret: 2, finger: 1 } }, _barre: { fret: 2, finger: 1, fromString: "A", toString: "e1" } },

  // ---- 7 ----
  C7:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 3, finger: 4 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  G7:  { notes: { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 1, finger: 1 } } },
  D7:  { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 2, finger: 3 } } },
  A7:  { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } } },
  E7:  { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Am7: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  Em7: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dm7: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } }, _barre: { fret: 1, finger: 1, fromString: "B", toString: "e1" } },

  // ---- maj7 ----
  Cmaj7: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Gmaj7: { notes: { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 2, finger: 1 } } },
  Dmaj7: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 2, finger: 2 }, e1: { fret: 2, finger: 3 } } },
  Amaj7: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } } },
  Emaj7: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 3 }, D: { fret: 1, finger: 1 }, G: { fret: 1, finger: 2 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Ammaj7: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } }, _barre: { fret: 1, finger: 1, fromString: "G", toString: "B" } },
  Emmaj7: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 1, finger: 1 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dmmaj7: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 2, finger: 3 }, e1: { fret: 1, finger: 1 } } },

  // ---- sus4 ----
  Csus4: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } }, _barre: { fret: 1, finger: 1, fromString: "B", toString: "e1" } },
  Gsus4: { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 1, finger: 3 }, e1: { fret: 3, finger: 4 } } },
  Dsus4: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 3, finger: 4 } } },
  Asus4: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 3, finger: 4 }, e1: { fret: 0 } } },
  Esus4: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 2, finger: 4 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Amsus4: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 3, finger: 4 }, e1: { fret: 0 } } },
  Emsus4: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dmsus4: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 3, finger: 3 } } },

  // ---- sus2 ----
  Esus2: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 5, finger: 4 }, e1: { fret: 2, finger: 1 } }, _barre: { fret: 2, finger: 1, fromString: "D", toString: "e1" } },

  // ---- add9 ----
  Cadd9: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 2 }, D: { fret: 2, finger: 1 }, G: { fret: 0 }, B: { fret: 3, finger: 3 }, e1: { fret: 0 } } },
  Gadd9: { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 2, finger: 3 }, B: { fret: 0 }, e1: { fret: 3, finger: 4 } } },
  Dadd9: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 2 }, e1: { fret: 0 } } },
  Aadd9: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 2, finger: 2 }, e1: { fret: 0 } } },
  Eadd9: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 3 }, B: { fret: 0 }, e1: { fret: 2, finger: 4 } } },
  Amadd9: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 1, finger: 2 }, e1: { fret: 0 } } },
  Emadd9: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 2, finger: 3 } } },
  Dmadd9: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 2 }, e1: { fret: 0 } } },

  // ---- add11 (open voicings for common roots) ----
  Cadd11: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } } },
  Gadd11: { notes: { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  Dadd11: { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 3, finger: 4 }, e1: { fret: 2, finger: 3 } } },
  Aadd11: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } } },
  Eadd11: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } } },

  // ---- 11 (dominant 11th — b7 + 9 + 11, 3rd often omitted) ----
  G11:  { notes: { E6: { fret: 3, finger: 3 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 2 } } },
  A11:  { notes: { E6: { fret: -1 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  E11:  { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 0 }, e1: { fret: 2, finger: 2 } } },
  D11:  { notes: { E6: { fret: -1 }, A: { fret: 5, finger: 1 }, D: { fret: 5, finger: 1 }, G: { fret: 5, finger: 1 }, B: { fret: 5, finger: 1 }, e1: { fret: 5, finger: 1 } }, _barre: { fret: 5, finger: 1, fromString: "A", toString: "e1" } },

  // ---- 6/9 (6th + 9th, no 7th) ----
  "G6/9": { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } } },
  "C6/9": { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 2 }, D: { fret: 2, finger: 1 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 0 } } },
  "A6/9": { notes: { E6: { fret: -1 }, A: { fret: 0 }, D: { fret: 4, finger: 3 }, G: { fret: 4, finger: 4 }, B: { fret: 2, finger: 1 }, e1: { fret: 2, finger: 1 } }, _barre: { fret: 2, finger: 1, fromString: "B", toString: "e1" } },
  "E6/9": { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 1 }, G: { fret: 1, finger: 2 }, B: { fret: 2, finger: 3 }, e1: { fret: 2, finger: 4 } } },

  // ---- 6 ----
  C6:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 4 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  A6:  { notes: { E6: { fret: -1 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 2, finger: 1 }, B: { fret: 2, finger: 1 }, e1: { fret: 2, finger: 1 } }, _barre: { fret: 2, finger: 1, fromString: "D", toString: "e1" } },
  D6:  { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 0 }, e1: { fret: 2, finger: 2 } } },
  "E6":  { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 1, finger: 1 }, B: { fret: 2, finger: 4 }, e1: { fret: 0 } } },
  G6:  { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Am6: { notes: { E6: { fret: -1 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 1, finger: 1 }, e1: { fret: 2, finger: 4 } } },

  // ---- dim ----
  Cdim:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 2 }, D: { fret: 4, finger: 3 }, G: { fret: 2, finger: 1 }, B: { fret: 4, finger: 4 }, e1: { fret: -1 } } },

  // ---- dim7 ----
  Cdim7: { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 2 }, D: { fret: 4, finger: 3 }, G: { fret: 2, finger: 1 }, B: { fret: 4, finger: 4 }, e1: { fret: 2, finger: 1 } }, _barre: { fret: 2, finger: 1, fromString: "G", toString: "e1" } },
  Adim7: { notes: { E6: { fret: -1 }, A: { fret: 0 }, D: { fret: 1, finger: 1 }, G: { fret: 2, finger: 3 }, B: { fret: 1, finger: 2 }, e1: { fret: 2, finger: 4 } } },

  // ---- aug ----
  Caug:  { notes: { E6: { fret: -1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 1, finger: 1 }, e1: { fret: -1 } }, _barre: { fret: 1, finger: 1, fromString: "G", toString: "B" } },
  Eaug:  { notes: { E6: { fret: 0 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } }, _barre: { fret: 1, finger: 1, fromString: "G", toString: "B" } },
  Aaug:  { notes: { E6: { fret: -1 }, A: { fret: 0 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 2, finger: 3 }, e1: { fret: 1, finger: 1 } } },
  Faug:  { notes: { E6: { fret: -1 }, A: { fret: -1 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 2, finger: 3 }, e1: { fret: 1, finger: 1 } } },
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
  "9":   2,
  "11":  5,
  "6/9": 2,
};

export function buildChordIntervals(quality: Quality, tension?: string): number[] {
  const base = [...CHORD_FORMULAS[quality]];

  if (!tension) return base;

  // --- Simple "add" tensions: just add the note, no 7th implied ---
  if (tension === "add9") {
    if (!base.includes(2)) base.push(2);
    return base;
  }
  if (tension === "add11") {
    if (!base.includes(5)) base.push(5);
    return base;
  }

  // --- "9" = dominant 9th: add 9th + imply b7 ---
  // But if base already has a 7th (b7=10 or maj7=11), don't override it.
  // Cmaj7+9 → Cmaj9 [0,2,4,7,11] not [0,2,4,7,10,11]
  if (tension === "9") {
    if (!base.includes(2)) base.push(2);
    const has7th = base.includes(10) || base.includes(11);
    if (!has7th) base.push(10); // imply b7 only when no 7th present
    return base;
  }

  // --- "11" = dominant 11th: add 11th + 9th + imply b7 ---
  // Same 7th rule as "9". The 3rd is often dropped in voicing
  // (handled by scoring, not here — formula still includes it).
  if (tension === "11") {
    if (!base.includes(5)) base.push(5);
    if (!base.includes(2)) base.push(2);
    const has7th = base.includes(10) || base.includes(11);
    if (!has7th) base.push(10);
    return base;
  }

  // --- "6/9" = add both 6th and 9th, NO 7th implied ---
  if (tension === "6/9") {
    if (!base.includes(9)) base.push(9);
    if (!base.includes(2)) base.push(2);
    return base;
  }

  return base;
}

// Two families per quality: E-shape (root on low E) and A-shape (root on A).

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
    { baseSemitone: 4, rootStringIndex: 0, frets: [null, 2, 2, 1, 2, null] },
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
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, null, 1, 2, 1, 2] },
  ],
  aug: [
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, null, 3, 2, 2, 1] },
  ],
  sus4: [
    { baseSemitone: 4, rootStringIndex: 0, frets: [0, 2, 2, 2, 0, 0] },
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 2, 3, 0] },
  ],
  sus2: [
    { baseSemitone: 9, rootStringIndex: 1, frets: [null, 0, 2, 2, 0, 0] },
    { baseSemitone: 4, rootStringIndex: 0, frets: [null, null, 2, 4, 5, 2] },
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

// ---------------------------------------------------------------------------
// Finger assignment
// ---------------------------------------------------------------------------

function assignFingers(
  playedStrings: { index: number; fret: number }[],
  hasBarre: boolean,
  barreFret: number,
  barreFrom?: number,
  barreTo?: number,
): Map<number, Finger> {
  const fingerMap = new Map<number, Finger>();
  const frettedStrings = playedStrings.filter(s => s.fret > 0);

  if (frettedStrings.length === 0) return fingerMap;

  if (hasBarre) {
    const bFrom = barreFrom ?? 0;
    const bTo = barreTo ?? 5;

    // Check: are there fretted strings at barreFret BELOW the barre range?
    // E.g. C(9) [x,3,0,3,3,0] → A at fret 3 is below barre G-B
    const bassBelowBarre = frettedStrings.filter(
      s => s.fret === barreFret && s.index < bFrom,
    );

    if (bassBelowBarre.length > 0) {
      // ── Position-based assignment ──
      // When bass notes exist below the barre at the same fret,
      // assign fingers by string position (bass=lower finger number).
      // This matches natural hand posture: index on bass side, ring on treble.
      //
      // finger = 1 + (string_index - lowest_fretted_string_index)
      // Adjacent strings at same fret share one finger (mini-barre).

      const minStringIdx = Math.min(...frettedStrings.map(s => s.index));

      // First: assign same-fret strings by position
      const sameFretStrings = frettedStrings.filter(s => s.fret === barreFret);
      for (const s of sameFretStrings) {
        const rawFinger = 1 + (s.index - minStringIdx);
        const finger = Math.min(rawFinger, 4) as Finger;
        fingerMap.set(s.index, finger);
      }

      // Merge adjacent same-fret strings to share one finger (mini-barre)
      // E.g. G(3) and B(4) both at fret 3 → both get finger of G
      for (let i = 0; i < sameFretStrings.length - 1; i++) {
        const curr = sameFretStrings[i];
        const next = sameFretStrings[i + 1];
        if (next.index === curr.index + 1) {
          fingerMap.set(next.index, fingerMap.get(curr.index)!);
        }
      }

      // Then: assign higher-fret strings with remaining fingers
      const usedFingers = new Set(fingerMap.values());
      const available: Finger[] = ([1, 2, 3, 4] as Finger[]).filter(
        f => !usedFingers.has(f),
      );
      const higherFretStrings = frettedStrings
        .filter(s => s.fret > barreFret)
        .sort((a, b) => a.fret - b.fret || a.index - b.index);

      higherFretStrings.forEach((s, i) => {
        if (i < available.length) fingerMap.set(s.index, available[i]);
      });
    } else {
      // ── Standard barre assignment ──
      // Barre starts from the lowest fretted string → finger 1 = barre
      for (const s of frettedStrings) {
        if (s.fret === barreFret && s.index >= bFrom && s.index <= bTo) {
          fingerMap.set(s.index, 1);
        }
      }

      const remaining = frettedStrings
        .filter(s => !fingerMap.has(s.index))
        .sort((a, b) => a.fret - b.fret || a.index - b.index);

      const extra: Finger[] = [2, 3, 4];
      remaining.forEach((s, i) => {
        if (i < extra.length) fingerMap.set(s.index, extra[i]);
      });
    }
  } else {
    // ── No barre: sort by fret, then string index ──
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

// ---------------------------------------------------------------------------
// Shape transposition (for non-tension chords)
// ---------------------------------------------------------------------------

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
  let hasBarre = offset > 0 && atMin.length >= 2 && minFret > 0;

  // Barre must span ALL played strings (lowest to highest index).
  // Standard barre chords (E/A shape) cover the full range with individual
  // fingers on top. A narrow barre that doesn't reach the outermost played
  // strings (e.g. dim7 [x,x,2,3,2,3]) is not a real barre pattern.
  if (hasBarre) {
    const barreIndicesCheck = atMin.map(s => s.index);
    const playedLo = Math.min(...played.map(s => s.index));
    const playedHi = Math.max(...played.map(s => s.index));
    const barreLo = Math.min(...barreIndicesCheck);
    const barreHi = Math.max(...barreIndicesCheck);
    if (barreLo !== playedLo || barreHi !== playedHi) {
      hasBarre = false;
    }
  }

  let barreIndices = hasBarre ? atMin.map(s => s.index) : [];
  let barreFret = minFret;
  let secondaryBarre = false;

  // Secondary barre: bass note(s) sit below a group of 3+ consecutive strings
  // at a higher fret. e.g. A6-shape C6 [x,3,5,5,5,5] → barre at fret 5, bass at fret 3.
  // The barre is only valid if no string in its range needs a different fret.
  if (!hasBarre && offset > 0 && minFret > 0) {
    const fretGroups = new Map<number, typeof played>();
    for (const s of played) {
      if (s.fret > minFret) {
        if (!fretGroups.has(s.fret)) fretGroups.set(s.fret, []);
        fretGroups.get(s.fret)!.push(s);
      }
    }
    for (const [fret, strings] of fretGroups) {
      if (strings.length >= 3) {
        const indices = strings.map(s => s.index);
        const lo = Math.min(...indices);
        const hi = Math.max(...indices);
        // Every string between lo and hi must be at this fret or muted
        const blocked = played.some(
          s => s.index > lo && s.index < hi && s.fret !== fret,
        );
        if (!blocked) {
          hasBarre = true;
          secondaryBarre = true;
          barreFret = fret;
          barreIndices = indices;
          break;
        }
      }
    }
  }

  const result: ChordData = { notes };

  if (secondaryBarre) {
    // Bass notes below the barre get ascending fingers starting from index
    const bassNotes = played
      .filter(s => s.fret < barreFret)
      .sort((a, b) => a.index - b.index);
    let nextFinger = 1;
    for (const s of bassNotes) {
      notes[STRING_NAMES[s.index]].finger = nextFinger as Finger;
      nextFinger++;
    }
    // Barre with ring finger (3) — natural reach over bass notes
    const barreFinger = Math.min(nextFinger + 1, 4) as Finger;
    for (const idx of barreIndices) {
      notes[STRING_NAMES[idx]].finger = barreFinger;
    }
    const bFrom = Math.min(...barreIndices);
    const bTo = Math.max(...barreIndices);
    result._barre = {
      fret: barreFret,
      finger: barreFinger,
      fromString: STRING_NAMES[bFrom],
      toString: STRING_NAMES[bTo],
    };
  } else {
    const bFrom = hasBarre ? Math.min(...barreIndices) : undefined;
    const bTo = hasBarre ? Math.max(...barreIndices) : undefined;

    const fingerMap = assignFingers(played, hasBarre, barreFret, bFrom, bTo);
    for (const [idx, finger] of fingerMap) {
      notes[STRING_NAMES[idx]].finger = finger;
    }

    if (hasBarre) {
      result._barre = {
        fret: barreFret,
        finger: 1,
        fromString: STRING_NAMES[bFrom!],
        toString: STRING_NAMES[bTo!],
      };
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Algorithmic Voicing Search — finds playable voicings for tension chords
// ---------------------------------------------------------------------------

/**
 * Identify the "character interval" that defines the chord's quality.
 * This interval MUST appear in any valid voicing — without it the chord
 * sounds like a different chord entirely.
 */
function getCharacterInterval(intervals: number[]): number | null {
  if (intervals.includes(3)) return 3;   // minor 3rd
  if (intervals.includes(4)) return 4;   // major 3rd
  if (intervals.includes(5)) return 5;   // sus4 (perfect 4th)
  // sus2: interval 2 is both the character AND the tension — handled naturally
  if (intervals.includes(2) && !intervals.includes(3) && !intervals.includes(4)) return 2;
  return null;
}

/**
 * Compute the set of intervals that MUST appear in any valid voicing.
 * Without these, the chord is fundamentally a different chord.
 *
 * The perfect 5th (7) is always optional — it's the most omittable
 * note in almost every chord voicing.
 */
function getRequiredIntervals(
  targetIntervals: number[],
  tension?: string,
): Set<number> {
  const req = new Set<number>([0]); // root always required

  // Character interval (3rd / sus)
  const charIv = getCharacterInterval(targetIntervals);
  if (charIv !== null) {
    // Major 3rd (4) clashes with 11th (5) — one semitone apart.
    // In real 11th voicings, the 3rd is almost always omitted.
    // Minor 3rd (3) does NOT clash with 11th — 2 semitones apart, fine to keep.
    const skip3rdFor11 = tension === "11" && charIv === 4;
    if (!skip3rdFor11) {
      req.add(charIv);
    }
  }

  // Tension interval(s)
  if (tension) {
    const tIv = TENSION_INTERVALS[tension];
    if (tIv !== undefined) req.add(tIv);

    // "9" chord: b7 distinguishes dominant 9th from add9
    if (tension === "9" && targetIntervals.includes(10)) req.add(10);

    // "11" chord: 11th is the defining tension
    if (tension === "11") {
      req.add(5); // 11th must be present
      // b7 is also required (it's what makes it "11" vs "add11")
      if (targetIntervals.includes(10)) req.add(10);
    }

    // "6/9" chord: both 6th and 9th are defining
    if (tension === "6/9") {
      req.add(9); // 6th
      req.add(2); // 9th
    }
  }

  // 7th-family: the 7th note defines the chord
  if (targetIntervals.includes(10)) req.add(10);  // b7 (dominant/minor 7th)
  if (targetIntervals.includes(11)) req.add(11);  // major 7th
  if (targetIntervals.includes(9) && targetIntervals.includes(6)) req.add(9); // bb7 in dim7

  // Altered 5ths define the chord quality
  if (targetIntervals.includes(6) && !targetIntervals.includes(7)) req.add(6); // dim5
  if (targetIntervals.includes(8)) req.add(8); // aug5

  // 6th chord: the 6th is essential
  if (targetIntervals.includes(9) && !targetIntervals.includes(6)) req.add(9);

  return req;
}

/**
 * For combinations that are physically impossible to voice on guitar,
 * produce progressively relaxed requirement sets.
 * Drops the least essential interval first.
 */
function getRelaxedRequirements(
  targetIntervals: number[],
  tension?: string,
): Set<number>[] {
  const strict = getRequiredIntervals(targetIntervals, tension);
  const relaxations: Set<number>[] = [];

  // If both bb7(9) and b7(10) required, try dropping bb7
  if (strict.has(9) && strict.has(10)) {
    const r = new Set(strict);
    r.delete(9);
    relaxations.push(r);
  }

  // Try dropping other intervals (least essential first)
  // 2=9th (tension, droppable), 9=6th/bb7, 8=aug5, 6=dim5, 11=maj7, 10=b7
  for (const drop of [2, 9, 8, 6, 11, 10]) {
    if (strict.has(drop) && drop !== 0) {
      const r = new Set(strict);
      r.delete(drop);
      if (!relaxations.some(existing => setsEqual(existing, r))) {
        relaxations.push(r);
      }
    }
  }

  return relaxations;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

interface VoicingCandidate {
  frets: number[];
  coveredIntervals: Set<number>;
  score: number;
}

/**
 * Search the fretboard for playable voicings that match the given intervals.
 *
 * Constraints enforced:
 *  - Root (interval 0) in the bass
 *  - All required intervals present (character, tension, 7th, etc.)
 *  - Max 4 fretted strings (4 fingers)
 *  - Fret span ≤ 4 among fretted notes
 *  - At least 3 played strings
 *  - No 3rd-quality contradiction
 *  - Graceful fallback for physically impossible combinations
 */
function searchVoicings(
  root: Root,
  targetIntervals: number[],
  tension?: string,
): ChordData[] {
  const rootSemi = SEMITONES[root];
  const targetSemis = new Set(targetIntervals.map(i => (rootSemi + i) % 12));
  const required = getRequiredIntervals(targetIntervals, tension);

  // Try strict requirements first
  let candidates = _doFretboardSearch(rootSemi, targetSemis, targetIntervals, required);

  // If nothing found, try relaxed requirements
  if (candidates.length === 0) {
    const relaxations = getRelaxedRequirements(targetIntervals, tension);
    for (const relaxed of relaxations) {
      candidates = _doFretboardSearch(rootSemi, targetSemis, targetIntervals, relaxed);
      if (candidates.length > 0) break;
    }
  }

  // Sort by score (higher = better), deduplicate, convert to ChordData
  candidates.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: ChordData[] = [];

  for (const c of candidates) {
    const key = c.frets.join(",");
    if (seen.has(key)) continue;
    seen.add(key);

    const chord = _candidateToChordData(c);
    if (chord) results.push(chord);

    if (results.length >= 10) break; // enough alternatives
  }

  return results;
}

/** Perform the fretboard search with a given set of required intervals. */
function _doFretboardSearch(
  rootSemi: number,
  targetSemis: Set<number>,
  targetIntervals: number[],
  required: Set<number>,
): VoicingCandidate[] {
  const candidates: VoicingCandidate[] = [];

  for (const bassIdx of [0, 1]) {
    const bassOpen = STRING_OPEN[STRING_NAMES[bassIdx]];

    for (let rootFret = 0; rootFret <= 12; rootFret++) {
      if ((bassOpen + rootFret) % 12 !== rootSemi) continue;

      const windowLow = Math.max(1, rootFret === 0 ? 1 : rootFret - 4);
      const windowHigh = Math.min(12, rootFret + 4);

      const perString: number[][] = [];

      for (let i = 0; i < 6; i++) {
        const strOpen = STRING_OPEN[STRING_NAMES[i]];

        if (i < bassIdx) {
          perString.push([-1]);
          continue;
        }
        if (i === bassIdx) {
          perString.push([rootFret]);
          continue;
        }

        const opts: number[] = [-1];
        if (targetSemis.has(strOpen % 12)) opts.push(0);
        for (let f = windowLow; f <= windowHigh; f++) {
          if (targetSemis.has((strOpen + f) % 12)) opts.push(f);
        }
        perString.push(opts);
      }

      _searchCombinations(perString, targetIntervals, rootSemi, required, bassIdx, candidates);
    }
  }

  return candidates;
}

/** Recursive backtracking search over per-string fret options. */
function _searchCombinations(
  perString: number[][],
  targetIntervals: number[],
  rootSemi: number,
  required: Set<number>,
  bassIdx: number,
  results: VoicingCandidate[],
): void {
  function recurse(
    stringIdx: number,
    frets: number[],
    covered: Set<number>,
    frettedCount: number,
    minFretted: number,
    maxFretted: number,
  ): void {
    if (stringIdx === 6) {
      // --- Evaluate complete voicing ---
      const playedCount = frets.filter(f => f >= 0).length;
      if (playedCount < 3) return;

      // All required intervals must be present
      for (const iv of required) {
        if (!covered.has(iv)) return;
      }

      // Don't contradict the 3rd quality
      const needs3 = targetIntervals.includes(3);
      const needs4 = targetIntervals.includes(4);
      if (needs3 && covered.has(4) && !covered.has(3)) return;
      if (needs4 && covered.has(3) && !covered.has(4)) return;

      // Minimum interval coverage
      let coverCount = 0;
      for (const iv of targetIntervals) {
        if (covered.has(iv)) coverCount++;
      }
      const minNeeded = Math.min(3, targetIntervals.length);
      if (coverCount < minNeeded) return;

      // --- Collect fretted string positions for playability analysis ---
      const frettedPos: { str: number; fret: number }[] = [];
      for (let i = 0; i < 6; i++) {
        if (frets[i] > 0) frettedPos.push({ str: i, fret: frets[i] });
      }

      // --- HARD REJECT: reverse fret pattern ---
      // Treble string at a LOWER fret than bass string = fingers reversed.
      // Two rules:
      // (A) Last pair of fretted strings: ALWAYS reject if reverse 2+ frets.
      //     No barre can help at the treble end.
      // (B) Other pairs: reject unless a continuous barre from bass side covers it.
      if (frettedPos.length >= 2) {
        const lastIdx = frettedPos.length - 1;

        for (let i = 0; i < lastIdx; i++) {
          const bFret = frettedPos[i].fret;
          const tFret = frettedPos[i + 1].fret;
          if (tFret >= bFret - 1) continue; // not reverse enough

          // Rule A: last pair → always reject
          if (i === lastIdx - 1) return;

          // Rule B: check continuous barre coverage from bass side
          const tStr = frettedPos[i + 1].str;
          const bStr = frettedPos[i].str;

          let canBarre = false;
          for (let j = 0; j < frettedPos.length; j++) {
            if (j === i + 1) continue;
            if (frettedPos[j].fret === tFret && frettedPos[j].str < bStr) {
              let continuous = true;
              for (let s = frettedPos[j].str; s <= tStr; s++) {
                if (frets[s] < tFret) { continuous = false; break; }
              }
              if (continuous) { canBarre = true; break; }
            }
          }

          if (!canBarre) return;
        }
      }

      // --- HARD REJECT: fretted notes scattered across 4+ strings with gaps ---
      // E.g. A=3, D=open, G=open, B=5 → 2 open strings between fretted
      if (frettedPos.length >= 2) {
        const firstStr = frettedPos[0].str;
        const lastStr = frettedPos[frettedPos.length - 1].str;
        const strSpan = lastStr - firstStr;
        const openGaps = strSpan - frettedPos.length; // non-fretted strings in between
        // If fretted notes span 4+ strings with 2+ gaps, and frets differ → reject
        if (openGaps >= 2 && maxFretted - minFretted >= 2) return;
      }

      // --- Score the voicing ---
      let score = 0;
      score += coverCount * 15;                    // coverage matters
      score += playedCount * 3;                    // fuller voicing
      score -= (maxFretted > 0 ? maxFretted : 0) * 2; // prefer low positions
      if (coverCount === targetIntervals.length) score += 5; // small bonus for full coverage

      // BONUS: compact hand position — fretted notes on adjacent strings
      if (frettedPos.length >= 2) {
        const firstStr = frettedPos[0].str;
        const lastStr = frettedPos[frettedPos.length - 1].str;
        const strSpan = lastStr - firstStr;
        if (strSpan <= frettedPos.length) score += 10; // fretted on adjacent strings
      }

      // BONUS: small fret span
      const span = maxFretted > 0 ? maxFretted - minFretted : 0;
      if (span <= 1) score += 10;
      else if (span <= 2) score += 5;

      // BONUS: natural ascending fret order (bass→treble)
      if (frettedPos.length >= 2) {
        let ascending = true;
        for (let i = 0; i < frettedPos.length - 1; i++) {
          if (frettedPos[i + 1].fret < frettedPos[i].fret - 1) {
            ascending = false;
            break;
          }
        }
        if (ascending) score += 8;
      }

      // Penalize internal gaps (muted strings between played ones)
      let seenPlayed = false;
      let seenMuteAfterPlayed = false;
      for (let i = bassIdx; i < 6; i++) {
        if (frets[i] >= 0) {
          if (seenMuteAfterPlayed) { score -= 20; break; }
          seenPlayed = true;
        } else if (seenPlayed) {
          seenMuteAfterPlayed = true;
        }
      }

      results.push({
        frets: [...frets],
        coveredIntervals: new Set(covered),
        score,
      });
      return;
    }

    // --- Try each candidate fret for this string ---
    for (const fret of perString[stringIdx]) {
      const isFretted = fret > 0;
      const newFrettedCount = frettedCount + (isFretted ? 1 : 0);
      if (newFrettedCount > 4) continue; // max 4 fingers

      const newMin = isFretted ? Math.min(minFretted, fret) : minFretted;
      const newMax = isFretted ? Math.max(maxFretted, fret) : maxFretted;
      if (newMax - newMin > 3) continue; // max span of 3 frets

      // Compute which interval this fret produces
      const newCovered = new Set(covered);
      if (fret >= 0) {
        const semi = (STRING_OPEN[STRING_NAMES[stringIdx]] + fret) % 12;
        const interval = (semi - rootSemi + 12) % 12;
        newCovered.add(interval);
      }

      frets[stringIdx] = fret;
      recurse(stringIdx + 1, frets, newCovered, newFrettedCount, newMin, newMax);
    }
  }

  recurse(0, new Array(6).fill(-1), new Set(), 0, 99, 0);
}

/** Convert a raw candidate into a ChordData with proper fingers and barre. */
function _candidateToChordData(candidate: VoicingCandidate): ChordData | null {
  const notes = {} as ChordData["notes"];
  const played: { index: number; fret: number }[] = [];

  for (let i = 0; i < 6; i++) {
    const fret = candidate.frets[i];
    notes[STRING_NAMES[i]] = { fret };
    if (fret >= 0) played.push({ index: i, fret });
  }

  const frettedStrings = played.filter(s => s.fret > 0);
  if (frettedStrings.length === 0) {
    return { notes }; // all open/muted — no fingers needed
  }

  const minFret = Math.min(...frettedStrings.map(s => s.fret));
  const atMin = frettedStrings.filter(s => s.fret === minFret);
  const aboveMin = frettedStrings.filter(s => s.fret > minFret);

  // ── BARRE DECISION ──
  // Use barre when:
  //  A) 4+ consecutive strings at same fret → barre is obviously easier
  //  B) Notes at higher frets exist AND grouping saves fingers
  // Don't use barre when all fretted notes are at same fret and ≤ 3 strings.
  let hasBarre = false;
  let barreFrom = -1;
  let barreTo = -1;

  if (atMin.length >= 2 && minFret > 0) {
    // Check if barre range is valid (no open/lower strings in between)
    const tryBarre = (from: number, to: number): boolean => {
      for (let i = from; i <= to; i++) {
        if (candidate.frets[i] < minFret) return false;
      }
      return true;
    };

    const fullFrom = Math.min(...atMin.map(s => s.index));
    const fullTo = Math.max(...atMin.map(s => s.index));
    const consecutiveCount = fullTo - fullFrom + 1;
    const fullBarreValid = tryBarre(fullFrom, fullTo);

    // Case A: 4+ consecutive strings at same fret → always barre
    if (atMin.length >= 4 && fullBarreValid && consecutiveCount === atMin.length) {
      hasBarre = true;
      barreFrom = fullFrom;
      barreTo = fullTo;
    }
    // Case B: notes at higher frets → barre when it helps
    else if (aboveMin.length > 0) {
      const totalFretted = atMin.length + aboveMin.length;
      const worthBarre = atMin.length >= 3 || totalFretted > 4
        || (atMin.length >= 2 && totalFretted >= 4);

      if (worthBarre) {
        if (fullBarreValid) {
          hasBarre = true;
          barreFrom = fullFrom;
          barreTo = fullTo;
        } else {
          // Try consecutive subset
          for (let start = 0; start < atMin.length - 1; start++) {
            for (let end = atMin.length - 1; end > start; end--) {
              const from = atMin[start].index;
              const to = atMin[end].index;
              if (tryBarre(from, to) && to - from >= 1) {
                hasBarre = true;
                barreFrom = from;
                barreTo = to;
                break;
              }
            }
            if (hasBarre) break;
          }
        }
      }
    }
  }

  // ── FINGER ASSIGNMENT ──
  const fingerMap = new Map<number, Finger>();

  if (hasBarre) {
    // Barre = Index(1) for strings within barre range at barre fret
    for (const s of frettedStrings) {
      if (s.fret === minFret && s.index >= barreFrom && s.index <= barreTo) {
        fingerMap.set(s.index, 1);
      }
    }

    // Remaining notes: assign finger based on fret distance from barre.
    // barreFret+1 → Middle(2), barreFret+2 → Ring(3), barreFret+3 → Pinky(4)
    // When multiple notes share same distance, give consecutive fingers.
    const remaining = frettedStrings
      .filter(s => !fingerMap.has(s.index))
      .sort((a, b) => a.fret - b.fret || a.index - b.index);

    let nextFinger = 2 as Finger;
    for (const s of remaining) {
      const distFinger = Math.min(1 + (s.fret - minFret), 4) as Finger;
      const finger = Math.max(distFinger, nextFinger) as Finger;
      if (finger > 4) break;
      fingerMap.set(s.index, finger);
      nextFinger = (finger + 1) as Finger;
    }
  } else {
    // No barre → assign by fret (lower fret = lower finger), then string.
    // This matches standard guitar fingering: Index on lowest fret, etc.
    const sorted = [...frettedStrings].sort(
      (a, b) => a.fret - b.fret || a.index - b.index,
    );
    const fingers: Finger[] = [1, 2, 3, 4];
    sorted.forEach((s, i) => {
      if (i < fingers.length) fingerMap.set(s.index, fingers[i]);
    });
  }

  for (const [idx, finger] of fingerMap) {
    notes[STRING_NAMES[idx]].finger = finger;
  }

  const result: ChordData = { notes };

  if (hasBarre) {
    result._barre = {
      fret: minFret,
      finger: 1,
      fromString: STRING_NAMES[barreFrom],
      toString: STRING_NAMES[barreTo],
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
 * Return all available voicings for a chord.
 *
 * Priority order:
 *  1. Handcrafted OVERRIDES (open-position, always preferred when available)
 *  2. Shape transposition (for non-tension chords)
 *  3. Algorithmic voicing search (for tension chords without overrides)
 *
 * Filters out unplayable results and deduplicates.
 */
export function generateFingerings(
  root: Root,
  quality: Quality,
  tension?: string,
): ChordVoicing[] {
  const result: ChordVoicing[] = [];

  // ── 1. Check handcrafted overrides first (always preferred) ──
  const key = overrideKey(root, quality, tension);
  if (OVERRIDES[key]) {
    const override = OVERRIDES[key];

    // Determine if this is truly an open voicing or a movable barre shape.
    // Movable barre = barre starts from E6 or A string, no open strings.
    // Partial barres (starting from D/G/B) are fingering details, not movable shapes.
    let overId: string;
    let overLabel: string;

    const hasOpenString = Object.values(override.notes).some(n => n.fret === 0);
    const isMovableBarre = override._barre && !hasOpenString
      && (override._barre.fromString === "E6" || override._barre.fromString === "A");

    if (isMovableBarre) {
      const e6Fret = override.notes.E6.fret;
      if (e6Fret >= 0) {
        overId = "e-shape";
        overLabel = "E Shape";
      } else {
        overId = "a-shape";
        overLabel = "A Shape";
      }
    } else {
      overId = "open";
      overLabel = "Open";
    }

    result.push({ id: overId, label: overLabel, data: override });
  }

  // ── 2. Non-tension chords: use existing shape transposition ──
  if (!tension) {
    const shapes = SHAPES[quality];
    if (shapes) {
      const overrideFamily = result.length > 0 ? result[0].id : null;

      for (const shape of shapes) {
        const shapeType = shape.rootStringIndex === 0 ? "e-shape" : "a-shape";

        // Skip when the override already covers this shape family
        if (overrideFamily === shapeType) continue;

        const rootString = STRING_NAMES[shape.rootStringIndex];
        const offset = (SEMITONES[root] - STRING_OPEN[rootString] + 12) % 12;
        // Open-position duplicate: skip when override is "open" (same voicing)
        if (offset === 0 && overrideFamily === "open") continue;

        const chord = transposeShape(shape, root);

        const frets = Object.values(chord.notes).map(n => n.fret);
        const hasPlayable = frets.some(f => f >= 0);
        const maxFret = Math.max(...frets);

        if (!hasPlayable) continue;
        if (maxFret > 14) continue;
        if (!validateVoicing(chord, root, quality)) continue;

        const isDuplicate = result.some(v => isSameShape(v.data, chord));
        if (isDuplicate) continue;

        const label = shape.rootStringIndex === 0 ? "E Shape" : "A Shape";

        result.push({ id: shapeType, label, data: chord });
      }
    }

    return result;
  }

  // ── 3. Tension chords: algorithmic voicing search ──
  const intervals = buildChordIntervals(quality, tension);

  const searchResults = searchVoicings(root, intervals, tension);

  for (const chord of searchResults) {
    // Skip duplicates of overrides or earlier results
    if (result.some(v => isSameShape(v.data, chord))) continue;

    // Determine shape label from bass string
    const e6Fret = chord.notes.E6.fret;
    const aFret = chord.notes.A.fret;
    let shapeFamily: string;
    let label: string;

    if (e6Fret >= 0) {
      shapeFamily = "e-shape";
      label = "E Shape";
    } else if (aFret >= 0) {
      shapeFamily = "a-shape";
      label = "A Shape";
    } else {
      shapeFamily = "d-shape";
      label = "D Shape";
    }

    // Compute position for unique id
    const playedFrets = Object.values(chord.notes)
      .map(n => n.fret)
      .filter(f => f > 0);
    const pos = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;

    const id = `${shapeFamily}-${pos}-${result.length}`;
    const posLabel = pos > 0 ? ` (Pos ${pos})` : "";

    result.push({ id, label: `${label}${posLabel}`, data: chord });

    // Cap at 4 total voicings (override + up to 3 alternatives)
    if (result.length >= 4) break;
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

/**
 * Check whether pressing `stringName` at `fret` produces a valid chord tone
 * for (root, quality, tension).  Used by the game checker to tolerate extra
 * barre notes that are musically correct.
 */
export function isChordTone(
  stringName: string,
  fret: number,
  root: Root,
  quality: Quality,
  tension?: string,
): boolean {
  if (fret < 0) return false;
  const openSemi = STRING_OPEN[stringName as Note];
  if (openSemi === undefined) return false;
  const noteSemi = (openSemi + fret) % 12;
  const rootSemi = SEMITONES[root];
  const interval = (noteSemi - rootSemi + 12) % 12;
  const intervals = buildChordIntervals(quality, tension);
  return intervals.includes(interval);
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
  { name: "Bm", data: OVERRIDES.Bm },
];
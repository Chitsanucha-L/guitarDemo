import type { ChordData, TensionType } from "./types";

export const chordTensions: Record<string, Record<TensionType, ChordData>> = {
  C: {
    "7": { notes: { E6: { fret: 0 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 3, finger: 4 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
    "maj7": { notes: { E6: { fret: 0 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
    "sus4": { notes: { E6: { fret: 0 }, A: { fret: 3, finger: 4 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 3, finger: 3 } } },
    "add9": { notes: { E6: { fret: 0 }, A: { fret: 3, finger: 2 }, D: { fret: 2, finger: 1 }, G: { fret: 0 }, B: { fret: 3, finger: 3 }, e1: { fret: 0 } } },
  },
  G: {
    "7": { notes: { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 1, finger: 1 } } },
    "maj7": { notes: { E6: { fret: 3, finger: 3 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 2, finger: 1 } } },
    "sus4": { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 1, finger: 3 }, e1: { fret: 3, finger: 4 } } },
    "add9": { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 2, finger: 3 }, B: { fret: 0 }, e1: { fret: 3, finger: 4 } } },
  },
  D: {
    "7": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 2, finger: 3 } } },
    "maj7": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 2, finger: 2 }, e1: { fret: 2, finger: 3 } } },
    "sus4": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 3, finger: 4 } } },
    "add9": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 2 }, e1: { fret: 0 } } },
  },
  A: {
    "7": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } } },
    "maj7": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 2, finger: 3 }, e1: { fret: 0 } } },
    "sus4": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 3, finger: 4 }, e1: { fret: 0 } } },
    "add9": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 2, finger: 2 }, e1: { fret: 0 } } },
  },
  E: {
    "7": { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } } },
    "maj7": { 
      notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 1, finger: 1 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } },
      _barre: { fret: 1, finger: 1, fromString: "D", toString: "G" }
    },
    "sus4": { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 2, finger: 4 }, B: { fret: 0 }, e1: { fret: 0 } } },
    "add9": { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 3 }, B: { fret: 0 }, e1: { fret: 2, finger: 4 } } },
  },
  F: {
    "7": { 
      notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } },
      _barre: { fret: 1, finger: 1, fromString: "E6", toString: "e1" }
    },
    "maj7": { 
      notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
      _barre: { fret: 1, finger: 1, fromString: "E6", toString: "B" }
    },
    "sus4": { 
      notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 4 }, D: { fret: 3, finger: 3 }, G: { fret: 3, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } },
      _barre: { fret: 1, finger: 1, fromString: "E6", toString: "e1" }
    },
    "add9": { 
      notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 3, finger: 2 } },
      _barre: { fret: 1, finger: 1, fromString: "E6", toString: "B" }
    },
  },
  Am: {
    "7": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
    "maj7": { 
      notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 1, finger: 1 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } },
      _barre: { fret: 1, finger: 1, fromString: "G", toString: "B" }
    },
    "sus4": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 3, finger: 4 }, e1: { fret: 0 } } },
    "add9": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 1 }, G: { fret: 4, finger: 3 }, B: { fret: 1, finger: 2 }, e1: { fret: 0 } } },
  },
  Em: {
    "7": { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
    "maj7": { 
      notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 1, finger: 1 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } }
    },
    "sus4": { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
    "add9": { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 1 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 2, finger: 3 } } },
  },
  Dm: {
    "7": { 
      notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } },
      _barre: { fret: 1, finger: 1, fromString: "B", toString: "e1" }
    },
    "maj7": { 
      notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 2, finger: 3 }, e1: { fret: 1, finger: 1 } }
    },
    "sus4": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 3, finger: 3 } } },
    "add9": { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 2 }, e1: { fret: 0 } } },
  },
};

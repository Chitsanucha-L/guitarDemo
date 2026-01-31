import type { ChordData } from "./types";

export const chords: Record<string, ChordData> = {
  C: { notes: { E6: { fret: 0 }, A: { fret: 3, finger: 3 }, D: { fret: 2, finger: 2 }, G: { fret: 0 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  G: { notes: { E6: { fret: 3, finger: 2 }, A: { fret: 2, finger: 1 }, D: { fret: 0 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 3, finger: 3 } } },
  D: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 1 }, B: { fret: 3, finger: 3 }, e1: { fret: 2, finger: 2 } } },
  A: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 2, finger: 4 }, e1: { fret: 0 } } },
  E: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 1, finger: 1 }, B: { fret: 0 }, e1: { fret: 0 } } },
  F: { 
    notes: { E6: { fret: 1, finger: 1 }, A: { fret: 3, finger: 3 }, D: { fret: 3, finger: 4 }, G: { fret: 2, finger: 2 }, B: { fret: 1, finger: 1 }, e1: { fret: 1, finger: 1 } },
    _barre: { fret: 1, finger: 1, fromString: "E6", toString: "e1" }
  },
  Am: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 2, finger: 2 }, G: { fret: 2, finger: 3 }, B: { fret: 1, finger: 1 }, e1: { fret: 0 } } },
  Em: { notes: { E6: { fret: 0 }, A: { fret: 2, finger: 2 }, D: { fret: 2, finger: 3 }, G: { fret: 0 }, B: { fret: 0 }, e1: { fret: 0 } } },
  Dm: { notes: { E6: { fret: 0 }, A: { fret: 0 }, D: { fret: 0 }, G: { fret: 2, finger: 2 }, B: { fret: 3, finger: 4 }, e1: { fret: 1, finger: 1 } } },
};

export const majorChords = ["C", "G", "D", "A", "E", "F"];
export const minorChords = ["Am", "Em", "Dm"];

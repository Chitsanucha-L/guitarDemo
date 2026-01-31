export type Note = "E6" | "A" | "D" | "G" | "B" | "e1";
export type Finger = 1 | 2 | 3 | 4;

export type TensionType = "7" | "maj7" | "sus4" | "add9";

export interface ChordData {
  notes: Record<Note, { fret: number; finger?: Finger }>;
  _barre?: {
    fret: number;
    finger: Finger;
    fromString: Note;
    toString: Note;
  };
}

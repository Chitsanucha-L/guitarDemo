export interface ChordProgression {
  id: string;
  label: string;
  chords: string[];
}

export const PROGRESSIONS: ChordProgression[] = [
  {
    id: "pop",
    label: "Pop (I V vi IV)",
    chords: ["C", "G", "Am", "F"],
  },
  {
    id: "50s",
    label: "50s (I vi IV V)",
    chords: ["C", "Am", "F", "G"],
  },
  {
    id: "axis",
    label: "Axis (vi IV I V)",
    chords: ["Am", "F", "C", "G"],
  },
  {
    id: "sad",
    label: "Sad (i VI III VII)",
    chords: ["Am", "F", "C", "G"],
  },
  {
    id: "country",
    label: "Country (I IV V I)",
    chords: ["G", "C", "D", "G"],
  },
  {
    id: "blues12",
    label: "12 Bar Blues",
    chords: ["C", "C", "C", "C", "F", "F", "C", "C", "G", "F", "C", "G"],
  },
];

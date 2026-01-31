import type { Finger, Note } from "./types";

export const fingerColors: Record<Finger, string> = {
  1: "#ff2424",
  2: "#31adff",
  3: "#00ff00",
  4: "#ffae00",
};

export const fingerNames: Record<Finger, string> = {
  1: "นิ้วชี้",
  2: "นิ้วกลาง",
  3: "นิ้วนาง",
  4: "นิ้วก้อย",
};

export const meshToNote: Record<string, Note> = {
  String_6_0: "E6",
  String_5_0: "A",
  String_4_0: "D",
  String_3_0: "G",
  String_2_0: "B",
  String_1_0: "e1",
};

export const stringToNote: Record<number, Note> = {
  6: "E6",
  5: "A",
  4: "D",
  3: "G",
  2: "B",
  1: "e1",
};

// แปลงจาก string number + fret เป็นชื่อโน้ต
export const getNoteName = (stringNum: number, fret: number): string => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // Open string notes (MIDI note numbers)
  const openNotes: Record<number, number> = {
    1: 64, // E4
    2: 59, // B3
    3: 55, // G3
    4: 50, // D3
    5: 45, // A2
    6: 40, // E2
  };

  const midiNote = openNotes[stringNum] + fret;
  const octave = Math.floor((midiNote - 12) / 12);
  const noteName = notes[midiNote % 12];

  return `${noteName}${octave}`;
};

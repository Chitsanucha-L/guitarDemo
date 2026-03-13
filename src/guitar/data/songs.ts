import type { ChordData } from "./types";
import { GAME_CHORDS, generateFingering } from "./chordShapes";
import type { Root, Quality } from "../types/chord";

export interface SongChord {
  chord: string;
  lyrics: string;
  beats: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  tempo: number;
  key: string;
  chords: SongChord[];
}

const CHORD_PARSE: Record<string, { root: Root; quality: Quality }> = {
  C: { root: "C", quality: "major" },
  D: { root: "D", quality: "major" },
  E: { root: "E", quality: "major" },
  F: { root: "F", quality: "major" },
  G: { root: "G", quality: "major" },
  A: { root: "A", quality: "major" },
  B: { root: "B", quality: "major" },
  Am: { root: "A", quality: "minor" },
  Em: { root: "E", quality: "minor" },
  Dm: { root: "D", quality: "minor" },
  Bm: { root: "B", quality: "minor" },
};

export function resolveChord(name: string): ChordData | null {
  const game = GAME_CHORDS.find((c) => c.name === name);
  if (game) return game.data;

  const parsed = CHORD_PARSE[name];
  if (parsed) return generateFingering(parsed.root, parsed.quality);

  return null;
}

export function getSongChordNames(song: Song): string[] {
  return [...new Set(song.chords.map((c) => c.chord))];
}

export const SONGS: Song[] = [
  {
    id: "stand-by-me",
    title: "Stand By Me",
    artist: "Ben E. King",
    tempo: 72,
    key: "G",
    chords: [
      { chord: "G", lyrics: "When the night", beats: 4 },
      { chord: "G", lyrics: "has come", beats: 4 },
      { chord: "Em", lyrics: "And the land", beats: 4 },
      { chord: "Em", lyrics: "is dark", beats: 4 },
      { chord: "C", lyrics: "And the moon", beats: 4 },
      { chord: "D", lyrics: "is the only", beats: 4 },
      { chord: "G", lyrics: "light we'll see", beats: 4 },
      { chord: "G", lyrics: "", beats: 4 },
      { chord: "G", lyrics: "No I won't", beats: 4 },
      { chord: "G", lyrics: "be afraid", beats: 4 },
      { chord: "Em", lyrics: "Oh I won't", beats: 4 },
      { chord: "Em", lyrics: "be afraid", beats: 4 },
      { chord: "C", lyrics: "Just as long", beats: 4 },
      { chord: "D", lyrics: "as you stand", beats: 4 },
      { chord: "G", lyrics: "Stand by me", beats: 4 },
      { chord: "G", lyrics: "", beats: 4 },
    ],
  },
  {
    id: "let-it-be",
    title: "Let It Be",
    artist: "The Beatles",
    tempo: 76,
    key: "C",
    chords: [
      { chord: "C", lyrics: "When I find myself", beats: 4 },
      { chord: "G", lyrics: "in times of trouble", beats: 4 },
      { chord: "Am", lyrics: "Mother Mary", beats: 4 },
      { chord: "F", lyrics: "comes to me", beats: 4 },
      { chord: "C", lyrics: "Speaking words of", beats: 4 },
      { chord: "G", lyrics: "wisdom", beats: 4 },
      { chord: "F", lyrics: "Let it", beats: 2 },
      { chord: "C", lyrics: "be", beats: 2 },
      { chord: "C", lyrics: "And in my hour", beats: 4 },
      { chord: "G", lyrics: "of darkness", beats: 4 },
      { chord: "Am", lyrics: "She is standing", beats: 4 },
      { chord: "F", lyrics: "right in front of me", beats: 4 },
      { chord: "C", lyrics: "Speaking words of", beats: 4 },
      { chord: "G", lyrics: "wisdom", beats: 4 },
      { chord: "F", lyrics: "Let it", beats: 2 },
      { chord: "C", lyrics: "be", beats: 2 },
    ],
  },
  {
    id: "knockin-on-heavens-door",
    title: "Knockin' on Heaven's Door",
    artist: "Bob Dylan",
    tempo: 68,
    key: "G",
    chords: [
      { chord: "G", lyrics: "Mama, take this", beats: 4 },
      { chord: "D", lyrics: "badge off of me", beats: 4 },
      { chord: "Am", lyrics: "I can't use", beats: 4 },
      { chord: "Am", lyrics: "it anymore", beats: 4 },
      { chord: "G", lyrics: "It's gettin' dark", beats: 4 },
      { chord: "D", lyrics: "too dark to see", beats: 4 },
      { chord: "Am", lyrics: "I feel I'm knockin'", beats: 4 },
      { chord: "Am", lyrics: "on heaven's door", beats: 4 },
      { chord: "G", lyrics: "Knock knock knockin'", beats: 4 },
      { chord: "D", lyrics: "on heaven's door", beats: 4 },
      { chord: "Am", lyrics: "Knock knock knockin'", beats: 4 },
      { chord: "Am", lyrics: "on heaven's door", beats: 4 },
      { chord: "G", lyrics: "Knock knock knockin'", beats: 4 },
      { chord: "D", lyrics: "on heaven's door", beats: 4 },
      { chord: "Am", lyrics: "Knock knock knockin'", beats: 4 },
      { chord: "Am", lyrics: "on heaven's door", beats: 4 },
    ],
  },
];

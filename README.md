# Guitar Trainer 3D

A **web-based guitar learning app** with a 3D fretboard, per-string/fret sampled audio, a **chord quiz game**, and **Song Mode** (lyrics + chords + metronome) for beginners.

---

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech stack](#tech-stack)
4. [Requirements](#requirements)
5. [Install and run](#install-and-run)
6. [Routes](#routes)
7. [Project structure](#project-structure)
8. [Assets and data](#assets-and-data)
9. [i18n](#i18n)
10. [npm scripts](#npm-scripts)
11. [Developer notes](#developer-notes)

---

## Overview

This repo works well as a **senior project or portfolio** piece. It combines:

- **React + TypeScript** for UI and state
- **React Three Fiber + Three.js** for the 3D guitar
- **Web Audio API** + MP3 samples per pluck
- **React Router** for separate app modes
- **i18next** for English and Thai UI strings

---

## Features

### Home `/` (Chord Builder)

| Item | Description |
|------|-------------|
| 3D guitar | GLB model; finger dots follow `ChordData` |
| Chord picker | Root, quality, tension → voicings from `chordShapes.ts` |
| Play mode | Click string/fret → plays `String_{n}_{fret}.mp3` |
| Strum / progression / scale | Extra panels in `Guitar3D.tsx` |

### Game Mode `/game`

| Item | Description |
|------|-------------|
| Difficulty | **Easy** — open major/minor only. **Medium** — Easy + F, Bm + **C#, D#, F#, G#, A#, B** major/minor (barre). **Hard** — all roots × qualities. **Very hard** — + tensions. |
| Chord pool | Driven by `src/guitar/data/gameDifficulty.ts` |
| Practice | **Win** = every pool chord correct once. **Within one game:** pass 1 = each chord once (no repeats); later passes = only chords still wrong, again no repeats per pass. **New game** = full pool reshuffled. |
| Challenge | Same deck rules + 1 min timer; stats in `localStorage` |
| Input | Tap frets to build shape; **drag across strings** for barre |
| Check | CHECK button → strum audio + compare to target chord |

### Song Mode `/songs` · `/songs/:songId`

| Item | Description |
|------|-------------|
| Song list | e.g. Stand By Me, Let It Be, Knockin' on Heaven's Door |
| Player | Chord + lyric slices with `beats` and BPM |
| Auto Play | Chord changes on the beat (pre-scheduled timeline) |
| Step by Step | Manual next chord |
| Audio | Strum follows current chord shape; optional metronome |

### Other

- **EN / TH** language toggle (stored in `localStorage`)
- Portrait warning on small screens (landscape recommended)

---

## Tech stack

| Area | Details |
|------|---------|
| Runtime | React 19, React DOM |
| Routing | react-router-dom 6 |
| 3D | three, @react-three/fiber, @react-three/drei |
| CSS | Tailwind CSS v4, @tailwindcss/vite |
| i18n | i18next, react-i18next |
| Build | Vite 7, TypeScript ~5.8 |

---

## Requirements

- **Node.js** (LTS 20+ recommended)
- A browser with **WebGL** and **Web Audio API**
- **`public/sounds/`** should contain the full MP3 set (see below). The app still runs if some files are missing, but those notes will be silent.

---

## Install and run

```bash
git clone <repo-url>
cd guitar-3d
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # tsc -b + vite build
npm run preview  # serve production build locally
npm run lint     # ESLint
```

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Chord builder + `Guitar3D` |
| `/game` | `GamePage` | Chord training game |
| `/songs` | `SongListPage` | Pick a song |
| `/songs/:songId` | `SongPlayerPage` | Play along (e.g. `stand-by-me`) |

---

## Project structure

```
guitar-3d/
├── public/
│   ├── models/
│   │   └── guitar.glb              # 3D model (meshes named String_{1..6}_{fret})
│   └── sounds/
│       └── String_{1-6}_{0-20}.mp3
├── src/
│   ├── App.tsx                     # BrowserRouter + Routes
│   ├── main.tsx
│   ├── index.css                   # Tailwind, fonts, animations
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── en.json
│   │   └── th.json
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── GamePage.tsx
│   │   ├── SongListPage.tsx
│   │   └── SongPlayerPage.tsx
│   └── guitar/
│       ├── Guitar3D.tsx            # Home UI + guitar canvas
│       ├── GuitarModel.tsx         # GLB, audio, pointer, strumRef / onStrumReady
│       ├── GameCanvas.tsx          # Game / Song canvas (orthographic camera)
│       ├── data/
│       │   ├── chordShapes.ts      # OVERRIDES, GAME_CHORDS, generateFingering
│       │   ├── songs.ts            # Song Mode data
│       │   ├── types.ts            # ChordData, Note, …
│       │   └── …
│       ├── hooks/
│       │   ├── useGuitarAudio.ts   # Samples, playSound, strumDirection
│       │   ├── useChordGame.ts     # Game state
│       │   ├── useSongPlayer.ts    # Song timeline, pre-scheduled timeouts
│       │   ├── useMetronome.ts
│       │   ├── usePlayerPressMarkers.ts
│       │   ├── useGuitarInteraction.ts
│       │   └── …
│       └── ui/                     # GameHUD, GameFeedback, LanguageSwitcher, …
├── package.json
└── README.md
```

---

## Assets and data

### 3D model

- File: **`public/models/guitar.glb`**
- Code looks up meshes by name **`String_{stringNum}_{fret}`**
  - `stringNum`: 1 = high e … 6 = low E

### Audio

- Loaded from **`/sounds/String_{n}_{fret}.mp3`** (n = 1…6, fret = 0…20)
- Used in `useGuitarAudio` and for strums (CHECK / Song Mode)

### Chords

- Definitions: **`src/guitar/data/chordShapes.ts`**
- Game list: **`GAME_CHORDS`**

### Songs

- **`src/guitar/data/songs.ts`**
- Each line: `{ chord, lyrics, beats }` — duration = `beats × (60 / BPM)` seconds

---

## i18n

- Config: **`src/i18n/index.ts`**
- Strings: **`en.json`**, **`th.json`**
- Active language stored in **`localStorage`** under key `lang`

---

## npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server + HMR |
| `npm run build` | TypeScript + Vite production build |
| `npm run preview` | Serve `dist` |
| `npm run lint` | ESLint |

---

## Developer notes

1. **GameCanvas** — With `strumRef` or non-empty `pressedPositions`, the canvas is in “game mode”: no full chord highlight; shows player dots + feedback markers instead.
2. **Song Mode** — Uses **`onStrumReady`** from `GuitarModel` to call **`strumDirection("down", delayMs)`**; `delayMs` scales with BPM.
3. **Barre rendering** — See **`usePlayerPressMarkers.ts`**.
4. **AudioContext** — Many browsers require a user gesture before audio plays.
5. **License** — `package.json` has `private: true`; add your own license and respect song copyright if you ship publicly.

---

To extend the app, start with **`src/guitar/data/songs.ts`** (new songs) and **`chordShapes.ts`** (new chords), then wire UI in `SongListPage` / `GamePage` as needed.

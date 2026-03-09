import { useEffect } from "react";
import * as THREE from "three";
import type { Note } from "../data/types";
import { stringToNote } from "../data/constants";
import { isScaleNote } from "../data/scales";

const ROOT_COLOR = "#facc15";
const SCALE_COLOR = "#38bdf8";
const ROOT_RADIUS = 0.016;
const SCALE_RADIUS = 0.013;
const MARKER_GROUP_NAME = "ScaleMarkers";

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const STRING_OPEN_SEMI: Record<Note, number> = {
  E6: 4, A: 9, D: 2, G: 7, B: 11, e1: 4,
};

function makeTextSprite(text: string, color: string, size: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 64);
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size, size, 1);
  return sprite;
}

export function useScaleHighlight(
  scene: THREE.Group | THREE.Scene,
  scaleNotes: number[] | null,
  rootSemitone: number | null,
  stringFretMap: React.MutableRefObject<Record<number, Record<number, THREE.Object3D>>>,
  fretRange: [number, number] = [0, 12],
) {
  useEffect(() => {
    const old = scene.getObjectByName(MARKER_GROUP_NAME);
    if (old) scene.remove(old);

    if (!scaleNotes || scaleNotes.length === 0) return;

    const group = new THREE.Group();
    group.name = MARKER_GROUP_NAME;

    const [minFret, maxFret] = fretRange;

    for (let stringNum = 1; stringNum <= 6; stringNum++) {
      const noteName = stringToNote[stringNum];
      if (!noteName) continue;

      for (let fret = minFret; fret <= maxFret; fret++) {
        if (!isScaleNote(noteName, fret, scaleNotes)) continue;

        const mesh = stringFretMap.current[stringNum]?.[fret];
        if (!mesh) continue;

        const world = new THREE.Vector3();
        mesh.getWorldPosition(world);
        const local = scene.worldToLocal(world.clone());

        const semitone = (STRING_OPEN_SEMI[noteName] + fret) % 12;
        const isRoot = semitone === rootSemitone;
        const color = isRoot ? ROOT_COLOR : SCALE_COLOR;
        const radius = isRoot ? ROOT_RADIUS : SCALE_RADIUS;
        const opacity = isRoot ? 0.95 : 0.75;

        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(radius, 32),
          new THREE.MeshBasicMaterial({
            color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity,
          }),
        );
        dot.position.set(local.x, local.y + 0.003, local.z);
        dot.rotation.x = -Math.PI / 2;
        group.add(dot);

        const label = CHROMATIC[semitone];
        const textColor = isRoot ? "#000000" : "#ffffff";
        const sprite = makeTextSprite(label, textColor, 0.018);
        sprite.position.set(local.x, local.y + 0.004, local.z);
        group.add(sprite);
      }
    }

    scene.add(group);

    return () => {
      const existing = scene.getObjectByName(MARKER_GROUP_NAME);
      if (existing) scene.remove(existing);
    };
  }, [scene, scaleNotes, rootSemitone, stringFretMap, fretRange]);
}

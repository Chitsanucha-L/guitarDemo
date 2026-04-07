import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { PressedPosition, PressedBarre, FeedbackMarker } from "./useChordGame";

const NOTE_TO_STRING_NUM: Record<string, number> = {
  E6: 6, A: 5, D: 4, G: 3, B: 2, e1: 1,
};

const PRESS_COLOR = 0x3b82f6;
const CORRECT_COLOR = 0x22c55e;
const WRONG_COLOR = 0xef4444;

/** Dot radius — barre cross-string width matches dot diameter (2×). */
const DOT_RADIUS = 0.022;
const BAR_CROSS_WIDTH = DOT_RADIUS * 1.5;
const BAR_PADDING = 0.03;

function disposeGroup(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

const noopRaycast = () => {};

function makeRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const rr = Math.min(r, w / 2, h / 2);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + rr, -h / 2);
  shape.lineTo(w / 2 - rr, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rr);
  shape.lineTo(w / 2, h / 2 - rr);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - rr, h / 2);
  shape.lineTo(-w / 2 + rr, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rr);
  shape.lineTo(-w / 2, -h / 2 + rr);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rr, -h / 2);
  return shape;
}

/** Map note name → string number; dedupe; sort descending (6 → 1). */
function sortedBarreStringNums(strings: string[]): number[] {
  const seen = new Set<number>();
  const nums: number[] = [];
  for (const s of strings) {
    const n = NOTE_TO_STRING_NUM[s];
    if (n !== undefined && !seen.has(n)) {
      seen.add(n);
      nums.push(n);
    }
  }
  nums.sort((a, b) => b - a);
  return nums;
}

/**
 * Resolve the barre bar color from feedback markers:
 * - No feedback → blue (playing state)
 * - All barre strings correct → green
 * - Any barre string wrong → red
 */
function resolveBarreColor(
  barre: PressedBarre,
  feedback: FeedbackMarker[],
): number {
  if (feedback.length === 0) return PRESS_COLOR;

  const fbMap = new Map<string, FeedbackMarker["type"]>();
  for (const f of feedback) fbMap.set(`${f.string}:${f.fret}`, f.type);

  let hasWrong = false;
  for (const s of barre.strings) {
    const type = fbMap.get(`${s}:${barre.fret}`);
    if (type === "wrong") { hasWrong = true; break; }
  }
  return hasWrong ? WRONG_COLOR : CORRECT_COLOR;
}

/**
 * Renders markers for player-pressed positions.
 * Barre uses explicit pressedBarre only; endpoints = highest vs lowest string
 * after sort (drag direction independent). Dots deduped; no dots under barre.
 *
 * When feedbackMarkers is non-empty the barre bar color switches to green/red.
 */
export function usePlayerPressMarkers(
  scene: THREE.Group | THREE.Scene,
  pressedPositions: PressedPosition[],
  pressedBarre: PressedBarre | null = null,
  feedbackMarkers: FeedbackMarker[] = [],
) {
  const markersRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (markersRef.current) {
      disposeGroup(markersRef.current);
      scene.remove(markersRef.current);
      markersRef.current = null;
    }

    const hasBarre =
      pressedBarre &&
      pressedBarre.strings.length > 0 &&
      pressedBarre.fret > 0;
    const deduped = new Map<string, PressedPosition>();
    for (const p of pressedPositions) {
      const key = `${p.string}_${p.fret}`;
      if (!deduped.has(key)) deduped.set(key, p);
    }
    const uniquePositions = Array.from(deduped.values());

    if (uniquePositions.length === 0 && !hasBarre) return;

    const group = new THREE.Group();
    group.name = "PlayerPressMarkers";

    const barreSkipDot = new Set<string>();
    if (pressedBarre && pressedBarre.fret > 0) {
      for (const s of pressedBarre.strings) {
        barreSkipDot.add(`${s}_${pressedBarre.fret}`);
      }
    }

    if (hasBarre && pressedBarre) {
      const { fret } = pressedBarre;
      const stringNums = sortedBarreStringNums(pressedBarre.strings);

      const barColor = resolveBarreColor(pressedBarre, feedbackMarkers);

      const endpoints: { stringNum: number; local: THREE.Vector3 }[] = [];
      for (const stringNum of stringNums) {
        const meshName = `String_${stringNum}_${fret}`;
        const mesh = scene.getObjectByName(meshName) as THREE.Mesh | undefined;
        if (!mesh) continue;
        const world = new THREE.Vector3();
        mesh.getWorldPosition(world);
        const local = scene.worldToLocal(world.clone());
        endpoints.push({ stringNum, local });
      }

      if (endpoints.length >= 2) {
        endpoints.sort((a, b) => b.stringNum - a.stringNum);
        const hi = endpoints[0].local;
        const lo = endpoints[endpoints.length - 1].local;

        const cx = (hi.x + lo.x) / 2;
        const cy = (hi.y + lo.y) / 2 + 0.005;
        const cz = (hi.z + lo.z) / 2;

        const dx = lo.x - hi.x;
        const dz = lo.z - hi.z;
        const span = Math.hypot(dx, dz) + BAR_PADDING;

        const mid = new THREE.Vector3(cx, cy, cz);
        const dir = new THREE.Vector3(dx, 0, dz);
        if (dir.lengthSq() < 1e-8) {
          dir.set(0, 0, 1);
        } else {
          dir.normalize();
        }
        const yaw = Math.atan2(dir.x, dir.z);

        const r = BAR_CROSS_WIDTH / 2;
        const glowW = BAR_CROSS_WIDTH + 0.006;
        const glowShape = makeRoundedRectShape(glowW, span + 0.012, glowW / 2);
        const barGlow = new THREE.Mesh(
          new THREE.ShapeGeometry(glowShape),
          new THREE.MeshBasicMaterial({
            color: barColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2,
          }),
        );
        barGlow.position.copy(mid);
        barGlow.rotation.order = "YXZ";
        barGlow.rotation.x = -Math.PI / 2;
        barGlow.rotation.y = yaw;
        barGlow.raycast = noopRaycast;
        group.add(barGlow);

        const barShape = makeRoundedRectShape(BAR_CROSS_WIDTH, span, r);
        const bar = new THREE.Mesh(
          new THREE.ShapeGeometry(barShape),
          new THREE.MeshBasicMaterial({
            color: barColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          }),
        );
        bar.position.copy(mid);
        bar.rotation.order = "YXZ";
        bar.rotation.x = -Math.PI / 2;
        bar.rotation.y = yaw;
        bar.raycast = noopRaycast;
        group.add(bar);
      }
    }

    for (const pos of uniquePositions) {
      const key = `${pos.string}_${pos.fret}`;
      if (barreSkipDot.has(key)) continue;

      const stringNum = NOTE_TO_STRING_NUM[pos.string];
      if (!stringNum) continue;

      const meshName = `String_${stringNum}_${pos.fret}`;
      const mesh = scene.getObjectByName(meshName) as THREE.Mesh | undefined;
      if (!mesh) continue;

      const world = new THREE.Vector3();
      mesh.getWorldPosition(world);
      const local = scene.worldToLocal(world.clone());

      const radius = DOT_RADIUS;

      const glow = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius * 1.4, 32),
        new THREE.MeshBasicMaterial({
          color: PRESS_COLOR,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.25,
        }),
      );
      glow.position.set(local.x, local.y + 0.003, local.z);
      glow.rotation.x = -Math.PI / 2;
      glow.raycast = noopRaycast;
      group.add(glow);

      const marker = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 32),
        new THREE.MeshBasicMaterial({
          color: PRESS_COLOR,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        }),
      );
      marker.position.set(local.x, local.y + 0.004, local.z);
      marker.rotation.x = -Math.PI / 2;
      marker.raycast = noopRaycast;
      group.add(marker);
    }

    scene.add(group);
    markersRef.current = group;

    return () => {
      if (markersRef.current) {
        disposeGroup(markersRef.current);
        scene.remove(markersRef.current);
        markersRef.current = null;
      }
    };
  }, [scene, pressedPositions, pressedBarre, feedbackMarkers]);
}

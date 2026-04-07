import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FeedbackMarker, PressedBarre } from "./useChordGame";

const NOTE_TO_STRING_NUM: Record<string, number> = {
  E6: 6, A: 5, D: 4, G: 3, B: 2, e1: 1,
};

const COLORS = {
  correct: 0x22c55e,
  wrong: 0xef4444,
} as const;

const OPACITIES = {
  correct: 0.92,
  wrong: 0.92,
};

const GLOW_OPACITIES = {
  correct: 0.3,
  wrong: 0.3,
};

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

export function useFeedbackMarkers(
  scene: THREE.Group | THREE.Scene,
  feedbackMarkers: FeedbackMarker[],
  pressedBarre: PressedBarre | null = null,
) {
  const markersRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (markersRef.current) {
      disposeGroup(markersRef.current);
      scene.remove(markersRef.current);
      markersRef.current = null;
    }

    if (feedbackMarkers.length === 0) return;

    const barreSkip = new Set<string>();
    if (pressedBarre && pressedBarre.fret > 0) {
      for (const s of pressedBarre.strings) {
        barreSkip.add(`${s}:${pressedBarre.fret}`);
      }
    }

    const group = new THREE.Group();
    group.name = "FeedbackMarkers";

    for (const fb of feedbackMarkers) {
      if (barreSkip.has(`${fb.string}:${fb.fret}`)) continue;
      const stringNum = NOTE_TO_STRING_NUM[fb.string];
      if (!stringNum) continue;

      const meshName = `String_${stringNum}_${fb.fret}`;
      const mesh = scene.getObjectByName(meshName) as THREE.Mesh | undefined;
      if (!mesh) continue;

      const world = new THREE.Vector3();
      mesh.getWorldPosition(world);
      const local = scene.worldToLocal(world.clone());

      const color = COLORS[fb.type];
      const opacity = OPACITIES[fb.type];
      const glowOpacity = GLOW_OPACITIES[fb.type];
      const radius = 0.02;

      const glow = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius * 1.8, 32),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: glowOpacity,
        }),
      );
      glow.position.set(local.x, local.y + 0.005, local.z);
      glow.rotation.x = -Math.PI / 2;
      glow.raycast = noopRaycast;
      group.add(glow);

      const marker = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 32),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity,
        }),
      );
      marker.position.set(local.x, local.y + 0.006, local.z);
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
  }, [scene, feedbackMarkers, pressedBarre]);
}

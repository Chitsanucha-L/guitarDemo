import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { PressedPosition } from "./useChordGame";

const NOTE_TO_STRING_NUM: Record<string, number> = {
  E6: 6, A: 5, D: 4, G: 3, B: 2, e1: 1,
};

const PRESS_COLOR = 0x00e5ff;

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

/**
 * Renders cyan dot markers on the 3D fretboard for the positions the player
 * has toggled.  Meshes are looked up directly from the scene by name
 * (`String_<num>_<fret>`) so this hook works regardless of whether
 * useGuitarCache has populated its refs yet.
 */
export function usePlayerPressMarkers(
  scene: THREE.Group | THREE.Scene,
  pressedPositions: PressedPosition[],
) {
  const markersRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    // Remove previous markers
    if (markersRef.current) {
      disposeGroup(markersRef.current);
      scene.remove(markersRef.current);
      markersRef.current = null;
    }

    if (pressedPositions.length === 0) return;

    const group = new THREE.Group();
    group.name = "PlayerPressMarkers";

    for (const pos of pressedPositions) {
      const stringNum = NOTE_TO_STRING_NUM[pos.string];
      if (!stringNum) continue;

      // Look up the mesh directly by name — no dependency on stringFretMap
      const meshName = `String_${stringNum}_${pos.fret}`;
      const mesh = scene.getObjectByName(meshName) as THREE.Mesh | undefined;
      if (!mesh) continue;

      const world = new THREE.Vector3();
      mesh.getWorldPosition(world);
      const local = scene.worldToLocal(world.clone());

      const radius = 0.02;

      // Outer glow ring
      const glow = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius * 1.6, 32),
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

      // Main marker
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
  }, [scene, pressedPositions]);
}

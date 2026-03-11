import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Note } from "../data/types";
import { getNote, stringNumToIndex, stringToNote } from "../data/constants";

export function useGuitarCache(scene: THREE.Group | THREE.Scene) {
  const stringMeshMap = useRef<Record<Note, THREE.Object3D>>({} as Record<Note, THREE.Object3D>);
  const fretMeshMap = useRef<Record<number, THREE.Object3D>>({} as Record<number, THREE.Object3D>);
  const stringFretMap = useRef<Record<number, Record<number, THREE.Object3D>>>({});
  const stringMeshes = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const oldHitboxes = scene.getObjectByName("StringHitboxes");

    if (oldHitboxes) {
      // Hitboxes already exist (React Strict Mode re-mount / HMR).
      // The THREE.js scene persists but React refs were reset to empty.
      // Rebuild all lookup maps from the existing scene objects.
      stringFretMap.current = {};
      stringMeshMap.current = {} as Record<Note, THREE.Object3D>;
      fretMeshMap.current = {} as Record<number, THREE.Object3D>;
      const meshes: THREE.Mesh[] = [];

      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          const match = child.name.match(/^String_(\d+)_(\d+)$/);
          if (match) {
            const stringNum = parseInt(match[1]);
            const fret = parseInt(match[2]);
            if (!stringFretMap.current[stringNum]) stringFretMap.current[stringNum] = {};
            stringFretMap.current[stringNum][fret] = child;
            if (fret === 0) {
              const noteKey = stringToNote[stringNum];
              if (noteKey) stringMeshMap.current[noteKey] = child;
            }
          }
        }
        if (child.name.match(/^Fret\d+$/)) {
          const fretNum = parseInt(child.name.replace("Fret", ""));
          if (!isNaN(fretNum)) fretMeshMap.current[fretNum] = child;
        }
      });

      oldHitboxes.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });
      stringMeshes.current = meshes;
      return;
    }

    // First mount — create hitboxes and build all lookup maps
    const meshes: THREE.Mesh[] = [];
    const hitboxGroup = new THREE.Group();
    hitboxGroup.name = "StringHitboxes";
    scene.add(hitboxGroup);

    stringMeshMap.current = {} as Record<Note, THREE.Object3D>;
    fretMeshMap.current = {} as Record<number, THREE.Object3D>;
    stringFretMap.current = {};

    scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        const match = child.name.match(/^String_(\d+)_(\d+)$/);
        if (match) {
          const stringNum = parseInt(match[1]);
          const fret = parseInt(match[2]);
          const stringIdx = stringNumToIndex(stringNum);
          const computedNote = getNote(stringIdx, fret);

          (child as any).userData.stringNum = stringNum;
          (child as any).userData.fret = fret;
          (child as any).userData.meshName = child.name;
          (child as any).userData.note = computedNote;

          if (!stringFretMap.current[stringNum]) {
            stringFretMap.current[stringNum] = {};
          }
          stringFretMap.current[stringNum][fret] = child;

          if (fret === 0) {
            const noteKey = stringToNote[stringNum];
            if (noteKey) {
              stringMeshMap.current[noteKey] = child;
            }
          }

          const stringMesh = child;
          const box = new THREE.Box3().setFromObject(stringMesh);
          const size = new THREE.Vector3();
          box.getSize(size);

          const center = new THREE.Vector3();
          stringMesh.getWorldPosition(center);
          hitboxGroup.worldToLocal(center);

          const hitboxGeometry = new THREE.BoxGeometry(
            0.03,
            0.01,
            size.z * 0.9,
          );

          const hitboxMaterial = new THREE.MeshBasicMaterial({
            visible: false,
          });

          const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
          hitbox.position.copy(center);
          hitbox.userData.stringNum = stringNum;
          hitbox.userData.fret = fret;
          hitbox.userData.meshName = child.name;
          hitbox.userData.note = computedNote;

          hitboxGroup.add(hitbox);
          meshes.push(hitbox);
        }
      }

      if (child.name.match(/^Fret\d+$/)) {
        const fretNum = parseInt(child.name.replace("Fret", ""));
        if (!isNaN(fretNum)) {
          fretMeshMap.current[fretNum] = child;
        }
      }
    });

    stringMeshes.current = meshes;
  }, [scene]);

  return {
    stringMeshMap,
    fretMeshMap,
    stringFretMap,
    stringMeshes,
  };
}

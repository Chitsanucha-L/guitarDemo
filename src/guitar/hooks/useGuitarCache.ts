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
    const meshes: THREE.Mesh[] = [];
    const hitboxGroup = new THREE.Group();
    hitboxGroup.name = "StringHitboxes";

    const oldHitboxes = scene.getObjectByName("StringHitboxes");
    if (oldHitboxes) return;

    stringMeshMap.current = {} as Record<Note, THREE.Object3D>;
    fretMeshMap.current = {} as Record<number, THREE.Object3D>;
    stringFretMap.current = {};

    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
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

          // Build 2D lookup: stringFretMap[stringNum][fret] → mesh
          if (!stringFretMap.current[stringNum]) {
            stringFretMap.current[stringNum] = {};
          }
          stringFretMap.current[stringNum][fret] = child;

          // Cache open-string (fret 0) meshes for chord marker positioning
          if (fret === 0) {
            const noteKey = stringToNote[stringNum];
            if (noteKey) {
              stringMeshMap.current[noteKey] = child;
            }
          }

          const stringMesh = child as THREE.Mesh;
          const box = new THREE.Box3().setFromObject(stringMesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          const hitboxGeometry = new THREE.BoxGeometry(
            0.03,
            0.01,
            size.z - 0.01,
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

    scene.add(hitboxGroup);
    stringMeshes.current = meshes;
  }, [scene]);

  return {
    stringMeshMap,
    fretMeshMap,
    stringFretMap,
    stringMeshes,
  };
}

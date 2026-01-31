import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Note } from "../data/types";
import { meshToNote } from "../data/constants";

export function useGuitarCache(scene: THREE.Group | THREE.Scene) {
  const stringMeshMap = useRef<Record<Note, THREE.Object3D>>({} as Record<Note, THREE.Object3D>);
  const fretMeshMap = useRef<Record<number, THREE.Object3D>>({} as Record<number, THREE.Object3D>);
  const stringMeshes = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    const hitboxGroup = new THREE.Group();
    hitboxGroup.name = "StringHitboxes";

    // ลบ hitbox เก่าถ้ามี
    const oldHitboxes = scene.getObjectByName("StringHitboxes");
    if (oldHitboxes) scene.remove(oldHitboxes);

    // Clear and rebuild caches
    stringMeshMap.current = {} as Record<Note, THREE.Object3D>;
    fretMeshMap.current = {} as Record<number, THREE.Object3D>;

    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        // ตรวจสอบว่าชื่อ mesh เป็นรูปแบบ String_X_Y หรือไม่
        const match = child.name.match(/^String_(\d+)_(\d+)$/);
        if (match) {
          const stringNum = parseInt(match[1]);
          const fret = parseInt(match[2]);
          (child as any).userData.stringNum = stringNum;
          (child as any).userData.fret = fret;
          (child as any).userData.meshName = child.name;

          // assign note สำหรับ open strings (fret 0) เพื่อใช้กับ chord highlighting
          if (meshToNote[child.name]) {
            const note = meshToNote[child.name];
            (child as any).userData.note = note;
            // Cache string mesh reference for open strings
            stringMeshMap.current[note] = child;
          }

          // สร้าง invisible hitbox ที่ใหญ่กว่า
          const stringMesh = child as THREE.Mesh;
          const box = new THREE.Box3().setFromObject(stringMesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // สร้าง hitbox 
          const hitboxGeometry = new THREE.BoxGeometry(
            0.03, 
            0.01, 
            size.z - 0.01 
          );

          const hitboxMaterial = new THREE.MeshBasicMaterial({
            visible: false,
            transparent: true,
            opacity: 0,
          });

          const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
          hitbox.position.copy(center);
          hitbox.userData.stringNum = stringNum;
          hitbox.userData.fret = fret;
          hitbox.userData.meshName = child.name;

          if (meshToNote[child.name]) {
            hitbox.userData.note = meshToNote[child.name];
          }

          hitboxGroup.add(hitbox);
          meshes.push(hitbox);
        }
      }
      
      // Cache fret mesh references
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
    stringMeshes,
  };
}

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ChordData, Note, Finger } from "../data/types";
import { fingerColors } from "../data/constants";

const NOTE_TO_STRING_NUM: Record<Note, number> = {
  E6: 6, A: 5, D: 4, G: 3, B: 2, e1: 1,
};

interface FingerPosition {
  string: Note;
  fret: number;
  fingerIndex: Finger;
}

interface BarreInfo {
  fret: number;
  fromString: Note;
  toString: Note;
  finger: Finger;
}

interface ChordShape {
  hasBarre: boolean;
  fingers: FingerPosition[];
  barre?: BarreInfo;
}

function getChordShape(chordData: ChordData | null): ChordShape | null {
  if (!chordData) return null;

  const fingers: FingerPosition[] = [];

  Object.entries(chordData.notes).forEach(([note, data]) => {
    if (data.finger && data.fret > 0) {
      fingers.push({
        string: note as Note,
        fret: data.fret,
        fingerIndex: data.finger,
      });
    }
  });

  const barre: BarreInfo | undefined = chordData._barre;

  return {
    hasBarre: !!barre,
    fingers,
    barre,
  };
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

function animateFingerDot(
  element: THREE.Mesh,
  type: "fadeOut" | "fadeIn",
  animationId: number,
  animationIdRef: React.MutableRefObject<number>,
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (animationIdRef.current !== animationId) {
        resolve();
        return;
      }

      const duration = type === "fadeOut" ? 100 : 120;
      const material = element.material as THREE.MeshBasicMaterial;
      const startOpacity = material.opacity;
      const targetOpacity = (element as any).userData?.targetOpacity;
      const endOpacity = type === "fadeOut" ? 0 : (targetOpacity ?? 1);
      const startScale = element.scale.clone();
      const endScale = new THREE.Vector3(
        type === "fadeOut" ? 0.9 : 1,
        type === "fadeOut" ? 0.9 : 1,
        type === "fadeOut" ? 0.9 : 1
      );

      const peakScale = type === "fadeIn" ? 1.05 : 1;

      const startTime = performance.now();

      const animate = () => {
        if (animationIdRef.current !== animationId) {
          resolve();
          return;
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);

        material.opacity = startOpacity + (endOpacity - startOpacity) * easeOut;

        if (type === "fadeIn") {
          let scaleFactor;
          if (progress < 0.7) {
            scaleFactor = startScale.x + (peakScale - startScale.x) * (easeOut / 0.7);
          } else {
            const settleProgress = (progress - 0.7) / 0.3;
            scaleFactor = peakScale + (endScale.x - peakScale) * settleProgress;
          }
          element.scale.set(scaleFactor, scaleFactor, scaleFactor);
        } else {
          element.scale.lerpVectors(startScale, endScale, easeOut);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          material.opacity = endOpacity;
          element.scale.copy(endScale);
          resolve();
        }
      };

      animate();
    }, delay);
  });
}

function animateBarre(
  barreGroup: THREE.Group,
  type: "fadeOut" | "fadeIn",
  animationId: number,
  animationIdRef: React.MutableRefObject<number>,
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (animationIdRef.current !== animationId) {
        resolve();
        return;
      }

      const barreMesh = barreGroup.children[0] as THREE.Mesh;
      if (!barreMesh) {
        resolve();
        return;
      }

      const duration = type === "fadeOut" ? 100 : 150;
      const material = barreMesh.material as THREE.MeshBasicMaterial;
      const startOpacity = material.opacity;
      const endOpacity = type === "fadeOut" ? 0 : 1;

      const startScale = barreGroup.scale.clone();

      const endScaleX = type === "fadeOut" ? 0.8 : 1;
      const endScale = new THREE.Vector3(endScaleX, startScale.y, startScale.z);

      const barreSlideDirection = -1;

      const startX = barreGroup.position.x;
      const slideAmount = type === "fadeIn" ? 0.01 : 0;
      const endX = type === "fadeIn" ? startX : startX + slideAmount;

      const startTime = performance.now();

      const animate = () => {
        if (animationIdRef.current !== animationId) {
          resolve();
          return;
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);

        material.opacity = startOpacity + (endOpacity - startOpacity) * easeOut;

        barreGroup.scale.lerpVectors(startScale, endScale, easeOut);

        if (type === "fadeIn") {
          barreGroup.position.x = startX + barreSlideDirection * slideAmount * (1 - easeOut);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          material.opacity = endOpacity;
          barreGroup.scale.copy(endScale);
          barreGroup.position.x = endX;
          resolve();
        }
      };

      animate();
    }, delay);
  });
}

// ---------------------------------------------------------------------------
// Cleanup helper – dispose geometries & materials to prevent GPU leaks
// ---------------------------------------------------------------------------

function disposeGroup(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m.dispose());
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useChordAnimation(
  scene: THREE.Group | THREE.Scene,
  highlightChord: ChordData | null,
  previousChord: ChordData | null,
  stringFretMap: React.MutableRefObject<Record<number, Record<number, THREE.Object3D>>>,
) {
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    const oldMarkers = scene.getObjectByName("HighlightMarkers");

    const prevShape = getChordShape(previousChord);
    const nextShape = getChordShape(highlightChord);

    const isTransition = previousChord !== null && oldMarkers !== undefined;

    async function playChordTransition() {
      const currentAnimationId = ++animationIdRef.current;

      if (!isTransition || !oldMarkers) {
        renderNewChord();
        return;
      }

      const prevHasBarre = prevShape?.hasBarre ?? false;
      const nextHasBarre = nextShape?.hasBarre ?? false;

      const oldDots: THREE.Mesh[] = [];
      const oldBarres: THREE.Group[] = [];

      oldMarkers.children.forEach((child: THREE.Object3D) => {
        if (child instanceof THREE.Group) {
          oldBarres.push(child);
        } else if (child instanceof THREE.Mesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry instanceof THREE.CircleGeometry) {
            oldDots.push(mesh);
          }
        }
      });

      if (!prevHasBarre && !nextHasBarre) {
        await Promise.all(oldDots.map((dot) => animateFingerDot(dot, "fadeOut", currentAnimationId, animationIdRef)));
        renderNewChord();
        animateNewMarkers(false, false, currentAnimationId);

      } else if (!prevHasBarre && nextHasBarre) {
        await Promise.all(oldDots.map((dot) => animateFingerDot(dot, "fadeOut", currentAnimationId, animationIdRef)));
        renderNewChord();
        animateNewMarkers(true, false, currentAnimationId);

      } else if (prevHasBarre && !nextHasBarre) {
        await Promise.all([
          ...oldBarres.map((barre) => animateBarre(barre, "fadeOut", currentAnimationId, animationIdRef)),
          ...oldDots.map((dot) => animateFingerDot(dot, "fadeOut", currentAnimationId, animationIdRef)),
        ]);
        renderNewChord();
        animateNewMarkers(false, true, currentAnimationId);

      } else {
        await Promise.all([
          ...oldBarres.map((barre) => animateBarre(barre, "fadeOut", currentAnimationId, animationIdRef)),
          ...oldDots.map((dot) => animateFingerDot(dot, "fadeOut", currentAnimationId, animationIdRef)),
        ]);
        renderNewChord();
        animateNewMarkers(true, false, currentAnimationId);
      }
    }

    function removeAllMarkers() {
      let existing = scene.getObjectByName("HighlightMarkers");
      while (existing) {
        disposeGroup(existing);
        scene.remove(existing);
        existing = scene.getObjectByName("HighlightMarkers");
      }
    }

    function renderNewChord() {
      removeAllMarkers();
      if (!highlightChord) return;

      const markerGroup = new THREE.Group();
      markerGroup.name = "HighlightMarkers";

      const positions: Array<{
        note: Note;
        fret: number;
        finger?: Finger;
        local: THREE.Vector3;
      }> = [];

      console.log("[Voicing]", Object.fromEntries(
        Object.entries(highlightChord.notes).map(([k, v]) => [k, v.fret])
      ), highlightChord._barre ? `barre: fret ${highlightChord._barre.fret} ${highlightChord._barre.fromString}→${highlightChord._barre.toString}` : "no barre");

      Object.entries(highlightChord.notes).forEach(([noteKey, chordNote]) => {
        const note = noteKey as Note;

        if (!chordNote || chordNote.fret < 0) return;

        const stringNum = NOTE_TO_STRING_NUM[note];
        const mesh = stringFretMap.current[stringNum]?.[chordNote.fret];
        if (!mesh) {
          console.warn(`[Voicing] Missing mesh: String_${stringNum}_${chordNote.fret} (${note})`);
          return;
        }

        const world = new THREE.Vector3();
        if (chordNote.fret === 0) {
          // Open string: place marker at nut end of segment (mesh pivot may be at fret end)
          const mesh1 = stringFretMap.current[stringNum]?.[1];
          if (mesh1) {
            const box = new THREE.Box3().setFromObject(mesh);
            const p1 = new THREE.Vector3();
            mesh1.getWorldPosition(p1);
            const min = box.min;
            const max = box.max;
            const corners = [
              min.clone(),
              new THREE.Vector3(max.x, min.y, min.z),
              new THREE.Vector3(min.x, max.y, min.z),
              new THREE.Vector3(max.x, max.y, min.z),
              new THREE.Vector3(min.x, min.y, max.z),
              new THREE.Vector3(max.x, min.y, max.z),
              new THREE.Vector3(min.x, max.y, max.z),
              max.clone(),
            ];
            let best = min.clone();
            let bestDist = -1;
            for (const c of corners) {
              const d = c.distanceToSquared(p1);
              if (d > bestDist) {
                bestDist = d;
                best.copy(c);
              }
            }
            world.copy(best);
          } else {
            mesh.getWorldPosition(world);
          }
        } else {
          mesh.getWorldPosition(world);
        }
        const local = scene.worldToLocal(world.clone());

        positions.push({
          note,
          fret: chordNote.fret,
          finger: chordNote.finger,
          local,
        });
      });

      const usedPositions = new Set<number>();

      // Render barre
      if (highlightChord._barre) {
        const barreInfo = highlightChord._barre;
        const finger = barreInfo.finger;
        const fret = barreInfo.fret;
        const fromString = barreInfo.fromString;
        const toString = barreInfo.toString;
        const color = fingerColors[finger];

        // Use String_X_Y meshes directly for barre endpoints
        const fromSn = NOTE_TO_STRING_NUM[fromString];
        const toSn = NOTE_TO_STRING_NUM[toString];
        const fromMesh = stringFretMap.current[fromSn]?.[fret];
        const toMesh = stringFretMap.current[toSn]?.[fret];

        if (fromMesh && toMesh) {
          const fromWorld = new THREE.Vector3();
          fromMesh.getWorldPosition(fromWorld);

          const toWorld = new THREE.Vector3();
          toMesh.getWorldPosition(toWorld);

          const fromLocal = scene.worldToLocal(fromWorld.clone());
          const toLocal = scene.worldToLocal(toWorld.clone());

          const minX = Math.min(fromLocal.x, toLocal.x);
          const maxX = Math.max(fromLocal.x, toLocal.x);

          const centerX = (minX + maxX) / 2;
          const length = maxX - minX + 0.01;

          const avgY = (fromLocal.y + toLocal.y) / 2;

          const avgZ = (fromLocal.z + toLocal.z) / 2;

          const barreWidth = 0.02;
          const cornerRadius = 0.01;

          const shape = new THREE.Shape();
          const halfWidth = length / 2;
          const halfHeight = barreWidth / 2;

          shape.moveTo(-halfWidth + cornerRadius, -halfHeight);
          shape.lineTo(halfWidth - cornerRadius, -halfHeight);
          shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + cornerRadius);
          shape.lineTo(halfWidth, halfHeight - cornerRadius);
          shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - cornerRadius, halfHeight);
          shape.lineTo(-halfWidth + cornerRadius, halfHeight);
          shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - cornerRadius);
          shape.lineTo(-halfWidth, -halfHeight + cornerRadius);
          shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + cornerRadius, -halfHeight);

          const extrudeSettings = {
            depth: 0.0001,
            bevelEnabled: true,
            bevelThickness: 0.0001,
            bevelSize: 0.007,
            bevelSegments: 2
          };

          const barreBar = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, extrudeSettings),
            new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity: isTransition ? 0 : 1,
            })
          );

          barreBar.position.set(
            centerX,
            avgY + 0.004,
            avgZ
          );

          barreBar.rotation.set(-Math.PI / 2, 0, 0);

          const barreGroup = new THREE.Group();
          barreGroup.position.copy(barreBar.position);
          barreBar.position.set(0, 0, 0);
          barreGroup.add(barreBar);

          if (isTransition) {
            barreGroup.scale.set(0.8, 1, 1);
          }

          markerGroup.add(barreGroup);

          positions.forEach((pos, index) => {
            if (pos.finger === finger && pos.fret === fret) {
              usedPositions.add(index);
            }
          });
        }
      }

      const hasBarre = !!highlightChord._barre;

      positions.forEach((pos, index) => {
        if (usedPositions.has(index)) return;

        const isOpen = pos.fret === 0;

        if (!isOpen && !pos.finger) return;

        const color = isOpen ? "#ffffff" : fingerColors[pos.finger!];
        const radius = isOpen ? 0.015 : 0.02;

        if (!isOpen && !hasBarre) {
          const glowRadius = radius * 1.6;
          const glow = new THREE.Mesh(
            new THREE.CircleGeometry(glowRadius, 32),
            new THREE.MeshBasicMaterial({
              color,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: isTransition ? 0 : 0.25,
            })
          );
          glow.position.set(pos.local.x, pos.local.y + 0.0035, pos.local.z);
          glow.rotation.x = -Math.PI / 2;
          (glow as any).userData = { targetOpacity: 0.25 };
          if (isTransition) glow.scale.set(0.9, 0.9, 0.9);
          markerGroup.add(glow);
        }

        const marker = new THREE.Mesh(
          isOpen
            ? new THREE.RingGeometry(radius * 0.55, radius, 32)
            : new THREE.CircleGeometry(radius, 32),
          new THREE.MeshBasicMaterial({
            color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isTransition ? 0 : 1,
          })
        );

        marker.position.set(
          pos.local.x,
          pos.local.y + 0.004,
          pos.local.z
        );

        marker.rotation.x = -Math.PI / 2;

        if (isTransition) {
          marker.scale.set(0.9, 0.9, 0.9);
        }

        if (!isOpen) {
          (marker as any).userData.fingerIndex = pos.finger;
        }

        markerGroup.add(marker);
      });

      scene.add(markerGroup);
    }

    function animateNewMarkers(hasBarre: boolean, useStagger: boolean = false, animationId: number) {
      const newMarkers = scene.getObjectByName("HighlightMarkers");
      if (!newMarkers) return;

      const dots: THREE.Mesh[] = [];
      const barres: THREE.Group[] = [];

      newMarkers.children.forEach((child: THREE.Object3D) => {
        if (child instanceof THREE.Group) {
          barres.push(child);
        } else if (child instanceof THREE.Mesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry instanceof THREE.CircleGeometry) {
            dots.push(mesh);
          }
        }
      });

      if (hasBarre) {
        barres.forEach((barre) => {
          animateBarre(barre, "fadeIn", animationId, animationIdRef, 0);
        });

        dots.forEach((dot) => {
          const fingerIndex = (dot as any).userData.fingerIndex || 1;
          const delay = 60 + fingerIndex * 40;
          animateFingerDot(dot, "fadeIn", animationId, animationIdRef, delay);
        });
      } else {
        if (useStagger) {
          dots.forEach((dot) => {
            const fingerIndex = (dot as any).userData.fingerIndex || 1;
            const delay = fingerIndex * 40;
            animateFingerDot(dot, "fadeIn", animationId, animationIdRef, delay);
          });
        } else {
          dots.forEach((dot) => {
            animateFingerDot(dot, "fadeIn", animationId, animationIdRef, 0);
          });
        }
      }
    }

    playChordTransition();

    return () => {
      ++animationIdRef.current;
    };
  }, [highlightChord, previousChord, scene, stringFretMap]);
}

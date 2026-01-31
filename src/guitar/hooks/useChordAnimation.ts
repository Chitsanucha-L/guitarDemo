import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ChordData, Note, Finger } from "../data/types";
import { fingerColors } from "../data/constants";

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

// แปลง chord data เป็น ChordShape format
function getChordShape(chordData: ChordData | null): ChordShape | null {
  if (!chordData) return null;

  const fingers: FingerPosition[] = [];

  // รวบรวมข้อมูลนิ้วและตำแหน่ง
  Object.entries(chordData.notes).forEach(([note, data]) => {
    if (data.finger && data.fret > 0) {
      fingers.push({
        string: note as Note,
        fret: data.fret,
        fingerIndex: data.finger,
      });
    }
  });

  // อ่าน barre metadata โดยตรง (ไม่ infer)
  const barre: BarreInfo | undefined = chordData._barre;

  return {
    hasBarre: !!barre,
    fingers,
    barre,
  };
}

// Animation helper: Animate finger dot
function animateFingerDot(
  element: THREE.Mesh,
  type: "fadeOut" | "fadeIn",
  animationId: number,
  animationIdRef: React.MutableRefObject<number>,
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Check if this animation is still valid
      if (animationIdRef.current !== animationId) {
        resolve();
        return;
      }

      const duration = type === "fadeOut" ? 100 : 120;
      const material = element.material as THREE.MeshStandardMaterial;
      const startOpacity = material.opacity;
      const endOpacity = type === "fadeOut" ? 0 : 1;
      const startScale = element.scale.clone();
      const endScale = new THREE.Vector3(
        type === "fadeOut" ? 0.9 : 1,
        type === "fadeOut" ? 0.9 : 1,
        type === "fadeOut" ? 0.9 : 1
      );

      // Peak scale for fadeIn (1.05 overshoot)
      const peakScale = type === "fadeIn" ? 1.05 : 1;

      const startTime = performance.now();

      const animate = () => {
        // Check if this animation is still valid
        if (animationIdRef.current !== animationId) {
          resolve();
          return;
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);

        // Opacity
        material.opacity = startOpacity + (endOpacity - startOpacity) * easeOut;

        // Scale with overshoot for fadeIn
        if (type === "fadeIn") {
          let scaleFactor;
          if (progress < 0.7) {
            // Go to peak (1.05) in first 70% of animation
            scaleFactor = startScale.x + (peakScale - startScale.x) * (easeOut / 0.7);
          } else {
            // Settle back to 1.0 in last 30%
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

// Animation helper: Animate barre
function animateBarre(
  barreGroup: THREE.Group,
  type: "fadeOut" | "fadeIn",
  animationId: number,
  animationIdRef: React.MutableRefObject<number>,
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Check if this animation is still valid
      if (animationIdRef.current !== animationId) {
        resolve();
        return;
      }

      // Get the actual mesh from inside the group
      const barreMesh = barreGroup.children[0] as THREE.Mesh;
      if (!barreMesh) {
        resolve();
        return;
      }

      const duration = type === "fadeOut" ? 100 : 150;
      const material = barreMesh.material as THREE.MeshStandardMaterial;
      const startOpacity = material.opacity;
      const endOpacity = type === "fadeOut" ? 0 : 1;

      // Apply scale to the GROUP, not the mesh
      const startScale = barreGroup.scale.clone();

      // Barre animates on X axis (width)
      const endScaleX = type === "fadeOut" ? 0.8 : 1;
      const endScale = new THREE.Vector3(endScaleX, startScale.y, startScale.z);

      // Configurable slide direction for future fretboard orientation changes
      const barreSlideDirection = -1; // -1 = slide from left, +1 = slide from right

      // Slight slide effect on X axis for realism - apply to GROUP
      const startX = barreGroup.position.x;
      const slideAmount = type === "fadeIn" ? 0.01 : 0;
      const endX = type === "fadeIn" ? startX : startX + slideAmount;

      const startTime = performance.now();

      const animate = () => {
        // Check if this animation is still valid
        if (animationIdRef.current !== animationId) {
          resolve();
          return;
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);

        // Opacity on mesh material
        material.opacity = startOpacity + (endOpacity - startOpacity) * easeOut;

        // Scale on GROUP
        barreGroup.scale.lerpVectors(startScale, endScale, easeOut);

        // Slide on GROUP
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

export function useChordAnimation(
  scene: THREE.Group | THREE.Scene,
  highlightChord: ChordData | null,
  previousChord: ChordData | null,
  stringMeshMap: React.MutableRefObject<Record<Note, THREE.Object3D>>,
  fretMeshMap: React.MutableRefObject<Record<number, THREE.Object3D>>,
) {
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    const oldMarkers = scene.getObjectByName("HighlightMarkers");

    // Get chord shapes
    const prevShape = getChordShape(previousChord);
    const nextShape = getChordShape(highlightChord);

    // Determine if this is a transition
    const isTransition = previousChord !== null && oldMarkers !== undefined;

    // Main transition orchestration
    async function playChordTransition() {
      // Increment animation ID to invalidate any ongoing animations
      const currentAnimationId = ++animationIdRef.current;

      if (!isTransition || !oldMarkers) {
        // No transition - just render new chord instantly
        renderNewChord();
        return;
      }

      // Detect transition type
      const prevHasBarre = prevShape?.hasBarre ?? false;
      const nextHasBarre = nextShape?.hasBarre ?? false;

      // Get old marker elements
      const oldDots: THREE.Mesh[] = [];
      const oldBarres: THREE.Group[] = [];

      oldMarkers.children.forEach((child: THREE.Object3D) => {
        // Barres are now wrapped in Groups
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
        // ====== Normal → Normal ======
        // Fade out old dots, then fade in new dots
        await Promise.all(oldDots.map((dot) => animateFingerDot(dot, "fadeOut", currentAnimationId, animationIdRef)));
        renderNewChord();
        animateNewMarkers(false, false, currentAnimationId);

      } else if (!prevHasBarre && nextHasBarre) {
        // ====== Normal → Barre ======
        // Phase 1: Release (fade out old dots)
        await Promise.all(oldDots.map((dot) => animateFingerDot(dot, "fadeOut", currentAnimationId, animationIdRef)));

        // Phase 2: Place barre chord (barre first, then dots with stagger)
        renderNewChord();
        animateNewMarkers(true, false, currentAnimationId);

      } else if (prevHasBarre && !nextHasBarre) {
        // ====== Barre → Normal ======
        // Fade out barre and dots, then fade in new dots with stagger
        await Promise.all([
          ...oldBarres.map((barre) => animateBarre(barre, "fadeOut", currentAnimationId, animationIdRef)),
          ...oldDots.map((dot) => animateFingerDot(dot, "fadeOut", currentAnimationId, animationIdRef)),
        ]);

        renderNewChord();
        animateNewMarkers(false, true, currentAnimationId); // Use stagger for normal chords after barre

      } else {
        // ====== Barre → Barre ======
        // Fade out old barre, then fade in new barre
        await Promise.all([
          ...oldBarres.map((barre) => animateBarre(barre, "fadeOut", currentAnimationId, animationIdRef)),
          ...oldDots.map((dot) => animateFingerDot(dot, "fadeOut", currentAnimationId, animationIdRef)),
        ]);

        renderNewChord();
        animateNewMarkers(true, false, currentAnimationId);
      }
    }

    function renderNewChord() {
      // Remove old markers
      if (oldMarkers) scene.remove(oldMarkers);
      if (!highlightChord) return;

      const markerGroup = new THREE.Group();
      markerGroup.name = "HighlightMarkers";

      // รวบรวมข้อมูลทุกตำแหน่งก่อน (ใช้ cached references แทน scene.traverse)
      const positions: Array<{
        note: Note;
        fret: number;
        finger?: Finger;
        stringLocal: THREE.Vector3;
        fretLocal: THREE.Vector3;
        xOffset: number;
        yOffset: number;
      }> = [];

      // Iterate through chord notes using cached string mesh references
      Object.entries(highlightChord.notes).forEach(([noteKey, chordNote]) => {
        const note = noteKey as Note;

        // Skip open strings
        if (!chordNote || chordNote.fret === 0) return;

        // Get cached string mesh reference
        const stringMesh = stringMeshMap.current[note];
        if (!stringMesh) return;

        // Get cached fret mesh reference
        const fretMesh = fretMeshMap.current[chordNote.fret];
        if (!fretMesh) return;

        const stringWorld = new THREE.Vector3();
        stringMesh.getWorldPosition(stringWorld);

        const fretWorld = new THREE.Vector3();
        fretMesh.getWorldPosition(fretWorld);

        // 🔑 แปลง world → local (ของ guitar)
        const stringLocal = scene.worldToLocal(stringWorld.clone());
        const fretLocal = scene.worldToLocal(fretWorld.clone());


        let xOffset = 0;
        if (note === "E6") xOffset = 0.02;
        if (note === "A") xOffset = 0.01;
        if (note === "D") xOffset = 0.003;
        if (note === "G") xOffset = -0.004;
        if (note === "B") xOffset = -0.013;
        if (note === "e1") xOffset = -0.02;

        let yOffset = -0.008;
        if (note === "E6") yOffset = -0.002;

        positions.push({
          note,
          fret: chordNote.fret,
          finger: chordNote.finger,
          stringLocal,
          fretLocal,
          xOffset,
          yOffset,
        });
      });

      // Track positions used by barre (to exclude from finger dots)
      const usedPositions = new Set<number>();

      // Render barre ONLY if explicit _barre metadata exists
      if (highlightChord._barre) {
        const barreInfo = highlightChord._barre;
        const finger = barreInfo.finger;
        const fret = barreInfo.fret;
        const fromString = barreInfo.fromString;
        const toString = barreInfo.toString;
        const color = fingerColors[finger];

        // Get string meshes for fromString and toString using cached references
        const fromStringMesh = stringMeshMap.current[fromString];
        const toStringMesh = stringMeshMap.current[toString];
        const fretMesh = fretMeshMap.current[fret];

        if (fromStringMesh && toStringMesh && fretMesh) {
          // Calculate positions for barre endpoints
          const fromWorld = new THREE.Vector3();
          fromStringMesh.getWorldPosition(fromWorld);

          const toWorld = new THREE.Vector3();
          toStringMesh.getWorldPosition(toWorld);

          const fretWorld = new THREE.Vector3();
          fretMesh.getWorldPosition(fretWorld);

          // 🔑 WORLD → LOCAL (ของ guitar)
          const fromLocal = scene.worldToLocal(fromWorld.clone());
          const toLocal = scene.worldToLocal(toWorld.clone());
          const fretLocal = scene.worldToLocal(fretWorld.clone());


          // Calculate offsets for each string
          let fromXOffset = 0;
          if (fromString === "E6") fromXOffset = 0.02;
          if (fromString === "A") fromXOffset = 0.01;
          if (fromString === "D") fromXOffset = 0.003;
          if (fromString === "G") fromXOffset = -0.004;
          if (fromString === "B") fromXOffset = -0.013;
          if (fromString === "e1") fromXOffset = -0.02;

          let toXOffset = 0;
          if (toString === "E6") toXOffset = 0.02;
          if (toString === "A") toXOffset = 0.01;
          if (toString === "D") toXOffset = 0.003;
          if (toString === "G") toXOffset = -0.004;
          if (toString === "B") toXOffset = -0.013;
          if (toString === "e1") toXOffset = -0.02;

          let fromYOffset = -0.008;
          if (fromString === "E6") fromYOffset = -0.002;

          let toYOffset = -0.008;
          if (toString === "E6") toYOffset = -0.002;

          // Calculate barre dimensions
          const minX = Math.min(fromLocal.x + fromXOffset, toLocal.x + toXOffset);
          const maxX = Math.max(fromLocal.x + fromXOffset, toLocal.x + toXOffset);

          const centerX = (minX + maxX) / 2;
          const length = maxX - minX;

          const avgY =
            ((fromLocal.y + fromYOffset) + (toLocal.y + toYOffset)) / 2;

          const avgZ = fretLocal.z;


          // สร้างแถบยาวแบบ rounded rectangle (แบนแต่หัวท้ายโค้ง)
          const barreWidth = 0.02; // ความกว้าง
          const cornerRadius = 0.01; // รัศมีมุมโค้ง

          // สร้าง shape แบบ rounded rectangle
          const shape = new THREE.Shape();
          const halfWidth = length / 2;
          const halfHeight = barreWidth / 2;

          // วาด rounded rectangle
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
            new THREE.MeshStandardMaterial({
              color,
              transparent: true,
              opacity: isTransition ? 0 : 1,
            })
          );

          barreBar.position.set(
            centerX,
            avgY - 0.003,
            avgZ
          );

          // หมุนให้วางแบนบนคอ
          barreBar.rotation.set(-Math.PI / 2, 0, 0);

          // Wrap barre in a group for correct animation transforms
          const barreGroup = new THREE.Group();
          barreGroup.position.copy(barreBar.position);
          barreBar.position.set(0, 0, 0); // Reset mesh position (relative to group)
          barreGroup.add(barreBar);

          // Set initial scale for animation on the GROUP
          if (isTransition) {
            barreGroup.scale.set(0.8, 1, 1);
          }

          markerGroup.add(barreGroup);

          // Mark positions that use the barre finger at the barre fret as "used"
          // so they don't get rendered as individual dots
          positions.forEach((pos, index) => {
            if (pos.finger === finger && pos.fret === fret) {
              usedPositions.add(index);
            }
          });
        }
      }

      // สร้างวงกลมสำหรับตำแหน่งที่ไม่ได้เป็น barre
      positions.forEach((pos, index) => {
        if (usedPositions.has(index)) return; // ข้ามตำแหน่งที่อยู่ใน barre แล้ว

        const color = pos.finger ? fingerColors[pos.finger] : "yellow";
        const marker = new THREE.Mesh(
          new THREE.CircleGeometry(0.02, 32),
          new THREE.MeshStandardMaterial({
            color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isTransition ? 0 : 1,
          })
        );

        marker.position.set(
          pos.stringLocal.x + pos.xOffset,
          pos.stringLocal.y + pos.yOffset,
          pos.fretLocal.z
        );

        marker.rotation.x = -Math.PI / 2;


        // Set initial scale for animation
        if (isTransition) {
          marker.scale.set(0.9, 0.9, 0.9);
        }

        // Store finger index for staggered animation
        (marker as any).userData.fingerIndex = pos.finger;

        markerGroup.add(marker);
      });

      scene.add(markerGroup);
    }

    // Animate new markers
    function animateNewMarkers(hasBarre: boolean, useStagger: boolean = false, animationId: number) {
      const newMarkers = scene.getObjectByName("HighlightMarkers");
      if (!newMarkers) return;

      const dots: THREE.Mesh[] = [];
      const barres: THREE.Group[] = [];

      newMarkers.children.forEach((child: THREE.Object3D) => {
        // Barres are now wrapped in Groups
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
        // Animate barre first, then dots with stagger
        barres.forEach((barre) => {
          animateBarre(barre, "fadeIn", animationId, animationIdRef, 0);
        });

        // Stagger dots after barre starts, using actual finger index
        dots.forEach((dot) => {
          const fingerIndex = (dot as any).userData.fingerIndex || 1;
          const delay = 60 + fingerIndex * 40; // Start after 60ms, then 40ms per finger
          animateFingerDot(dot, "fadeIn", animationId, animationIdRef, delay);
        });
      } else {
        // Normal dots
        if (useStagger) {
          // Staggered animation using actual finger index
          dots.forEach((dot) => {
            const fingerIndex = (dot as any).userData.fingerIndex || 1;
            const delay = fingerIndex * 40;
            animateFingerDot(dot, "fadeIn", animationId, animationIdRef, delay);
          });
        } else {
          // All at once
          dots.forEach((dot) => {
            animateFingerDot(dot, "fadeIn", animationId, animationIdRef, 0);
          });
        }
      }
    }

    // Execute transition
    playChordTransition();
  }, [highlightChord, previousChord, scene, stringMeshMap, fretMeshMap]);
}

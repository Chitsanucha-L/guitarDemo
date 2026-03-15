import { useEffect } from "react";
import { useGLTF, useProgress } from "@react-three/drei";

interface PreloadSceneProps {
  onReady: () => void;
  onProgress: (progress: number, active: boolean) => void;
}

/** Runs inside Canvas: preloads guitar.glb and reports progress. Call onReady when done. */
export default function PreloadScene({ onReady, onProgress }: PreloadSceneProps) {
  useGLTF("/models/guitar.glb");
  const { progress, active } = useProgress();

  useEffect(() => {
    onProgress(progress, active);
  }, [progress, active, onProgress]);

  useEffect(() => {
    if (!active) onReady();
  }, [active, onReady]);

  return null;
}

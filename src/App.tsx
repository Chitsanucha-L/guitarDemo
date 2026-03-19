import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import SongListPage from "./pages/SongListPage";
import SongPlayerPage from "./pages/SongPlayerPage";
import TunerPage from "./pages/TunerPage";
import PortraitWarning from "./guitar/ui/PortraitWarning";
import GlobalLoadingScreen from "./guitar/ui/GlobalLoadingScreen";
import PreloadScene from "./guitar/PreloadScene";
import { startAudioPreload } from "./guitar/audioPreload";
import { useAudioPreload } from "./guitar/hooks/useAudioPreload";

function App() {
  useEffect(() => {
    startAudioPreload();
  }, []);

  const { ready: audioReady, progress: audioProgress } = useAudioPreload();
  const [modelReady, setModelReady] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelActive, setModelActive] = useState(true);

  const allReady = audioReady && modelReady;

  if (!allReady) {
    return (
      <>
        <GlobalLoadingScreen
          modelProgress={modelProgress}
          modelActive={modelActive}
          audioReady={audioReady}
          audioProgress={audioProgress}
        />
        <Canvas
          camera={{ position: [0, 0, 1], fov: 30 }}
          gl={{ alpha: true, antialias: false }}
          style={{ position: "fixed", top: 0, left: 0, width: 1, height: 1, pointerEvents: "none" }}
        >
          <Suspense fallback={null}>
            <PreloadScene
              onReady={() => setModelReady(true)}
              onProgress={(p, a) => {
                setModelProgress(p);
                setModelActive(a);
              }}
            />
          </Suspense>
        </Canvas>
      </>
    );
  }

  return (
    <BrowserRouter>
      <PortraitWarning />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/songs" element={<SongListPage />} />
        <Route path="/songs/:songId" element={<SongPlayerPage />} />
        <Route path="/tuner" element={<TunerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

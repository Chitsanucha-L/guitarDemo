import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import SongListPage from "./pages/SongListPage";
import SongPlayerPage from "./pages/SongPlayerPage";
import PortraitWarning from "./guitar/ui/PortraitWarning";

function App() {
  return (
    <BrowserRouter>
      <PortraitWarning />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/songs" element={<SongListPage />} />
        <Route path="/songs/:songId" element={<SongPlayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

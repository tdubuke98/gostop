import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { PlayerProvider } from "./context/PlayerContext";
import { GameProvider } from "./context/GameContext";

export default function App() {
  return (
    <Router>
      <PlayerProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </GameProvider>
      </PlayerProvider>
    </Router>
  );
}

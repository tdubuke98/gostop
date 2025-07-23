import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "./context/PlayerContext";
import { GameProvider } from "./context/GameContext";
import Navbar from "./components/Navbar";
import StatsPage from "./pages/StatsPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import React, { useState, useEffect } from "react";

export default function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuth(true);
    }
  }, []);
  
  return (
    <Router>
      <PlayerProvider>
        <GameProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage isAuth={isAuth} />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/login" element={<LoginPage setIsAuth={setIsAuth} isAuth={isAuth} />} />
          </Routes>
        </GameProvider>
      </PlayerProvider>
    </Router>
  );
}

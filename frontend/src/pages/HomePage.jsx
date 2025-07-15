import React, { useState, useEffect } from "react";
import NewGameWizard from "../components/NewGameWizard";
import Leaderboard from "../components/Leaderboard";
import NewPlayer from "../components/NewPlayer";
import EditPlayer from "../components/EditPlayer";
import Navbar from "../components/Navbar";
import Games from "../components/Games";

export default function HomePage() {
  // Player stuff
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState(null);

  // Game stuff
  const [showNewGame, setShowNewGame] = useState(false);

  return (
    <div className="relative min-h-screen bg-gray-300">
      <Navbar />

      {showNewPlayer && (<NewPlayer setShowNewPlayer={setShowNewPlayer} />)}
      {editPlayerId !== null && (<EditPlayer editPlayerId={editPlayerId} setEditPlayerId={setEditPlayerId} />)}
      {showNewGame && (<NewGameWizard setShowNewGame={setShowNewGame} />)}

      <div className="flex flex-row h-[calc(100vh-118px)] gap-6 my-6 mx-6">
        <Leaderboard setShowNewPlayer={setShowNewPlayer} setEditPlayerId={setEditPlayerId} />
        <Games setShowNewGame={setShowNewGame} />
      </div>
    </div>
  );
}

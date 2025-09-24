import React, { useState } from "react";
import NewGameWizard from "../components/NewGameWizard";
import Leaderboard from "../components/Leaderboard";
import NewPlayer from "../components/NewPlayer";
import EditPlayer from "../components/EditPlayer";
import Games from "../components/Games";

export default function HomePage({ isAuth }) {
  // Player stuff
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState(null);

  // Game stuff
  const [showNewGame, setShowNewGame] = useState(false);

  return (
    <div className="bg-gray-300">
      {showNewPlayer && <NewPlayer setShowNewPlayer={setShowNewPlayer} />}
      {editPlayerId !== null && (
        <EditPlayer editPlayerId={editPlayerId} setEditPlayerId={setEditPlayerId} />
      )}
      {showNewGame && <NewGameWizard setShowNewGame={setShowNewGame} />}

      <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-68px)] gap-6 p-4 md:p-6">
        <Leaderboard setShowNewPlayer={setShowNewPlayer} setEditPlayerId={setEditPlayerId} isAuth={isAuth} />
        <Games setShowNewGame={setShowNewGame} isAuth={isAuth} />
      </div>
    </div>
  );
}

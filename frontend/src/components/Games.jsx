import React from "react";
import { useGames } from "../context/GameContext";
import { Trash } from "lucide-react";

export default function Games({ setShowNewGame, isAuth }) {
  const { games, deleteGame, numGames } = useGames();

  return (
    <div className="flex flex-grow flex-col w-full md:w-3/4 gap-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 md:p-6">
      <div className="flex flex-row justify-between items-center mb-4">
        {/* Left section: Title + Game count */}
        <div className="flex items-center gap-3 md:gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            Games
          </h2>
          <span className="bg-green-600 text-white text-sm font-bold px-3 py-0.5 rounded shadow">
            {numGames}
          </span>
        </div>

        {/* Right section: Button */}
        {isAuth && (
          <button
            onClick={() => setShowNewGame(true)}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded text-sm md:text-xl px-3 py-1"
          >
            + New Game
          </button>
        )}
      </div>

      <div className="flex flex-col overflow-y-auto rounded-lg gap-4">
        {games.map((game) => (
          <div
            key={game.game_id}
            className="flex flex-col bg-gray-700 rounded px-3 md:px-4 py-3 gap-3 shadow-md"
          >
            <div className="flex flex-row items-center justify-between border-b border-gray-600 pb-2">
              <span className="bg-green-600 text-white text-xs md:text-sm font-bold px-2 py-1 rounded shadow">
                Winner: {game.winner_name}
              </span>

              {isAuth && (
                <button
                  onClick={() => deleteGame(game.game_id)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded px-2 md:px-4 py-1 md:py-2"
                >
                  <Trash className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
            </div>

            <div className="flex flex-col pl-1 md:pl-2 gap-2">
              {game.players
                .slice()
                .sort((a, b) => b.point_delta - a.point_delta)
                .map((player, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-3 items-center bg-gray-800 rounded px-2 md:px-3 py-1"
                  >
                    <span className="text-gray-200 text-sm md:text-base font-medium">
                      {player.player_name}
                    </span>
                    <span className="text-gray-400 italic text-xs md:text-sm text-center">
                      {player.role}
                    </span>
                    <span
                      className={`text-xs md:text-sm font-semibold text-right ${
                        player.point_delta >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {player.point_delta > 0 && "+"}
                      {player.point_delta}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

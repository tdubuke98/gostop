import React from "react";
import { useGames } from "../context/GameContext";
import { Settings } from "lucide-react";

export default function Games({ setShowGameWizard, setEditGameId, isAuth }) {
  const { games, numGames } = useGames();

  return (
    <div className="flex flex-grow flex-col w-full md:w-3/4 gap-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 md:p-6">
      <div className="flex flex-row justify-between items-center">

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
            onClick={() => setShowGameWizard(true)}
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
            <div className="grid grid-cols-10 items-center border-b border-gray-600 pb-2">
              <span className="col-span-3 justify-self-left w-fit bg-green-600 text-white text-xs md:text-sm font-bold px-2 py-1 rounded shadow">
                {game.created_at}
              </span>

              {isAuth && (
                <button
                  onClick={() => { 
                    setEditGameId(game.game_id); 
                    setShowGameWizard(true);
                  }}
                  className="col-start-10 justify-self-end w-fit bg-blue-500 hover:bg-blue-600 content-center text-white rounded px-4 py-2"
                >
                  <Settings className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {game.players
                .slice()
                .sort((a, b) => b.point_delta - a.point_delta)
                .map((player, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-10 items-center rounded px-2 md:px-3 py-1 ${
                      game.winner_name === player.player_name
                        ? "bg-green-800"
                        : "bg-gray-800"
                    }`}
                  >
                    <span className="col-span-3 text-left text-gray-200 text-sm md:text-base font-medium">
                      {player.player_name}
                    </span>

                    <span className="col-span-3 text-left text-gray-400 italic text-xs md:text-sm">
                      {player.role}
                    </span>

                    <span
                      className={`col-start-10 text-right text-xs md:text-sm font-semibold ${
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

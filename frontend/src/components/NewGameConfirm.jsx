import React from "react";
import { usePlayers } from "../context/PlayerContext";

export default function NewGameConfirm({ playing, dealer, seller, winner }) {
  const { players } = usePlayers();

  return (
    <div className="flex flex-col overflow-y-auto gap-4">
      <h3 className="text-xl font-semibold text-white">Confirmation</h3>

      <div className="flex flex-col gap-4 h-full overflow-y-auto">
        {playing.map((p) => {
          const player = players.find(player => player.id === p.id);
          return (
            <div
              key={player.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg px-4 py-3 transition duration-200 bg-gray-700 hover:bg-gray-600"
            >
              {/* Player info */}
              <div className="flex flex-col mb-2 sm:mb-0">
                <span className="text-white font-semibold">{player.name}</span>
                <span className="text-gray-300 italic text-sm">{player.username}</span>
              </div>

              {/* Winner / Loser */}
              <span className="text-yellow-400 text-xs font-bold uppercase mb-2 sm:mb-0">
                {player.id === winner.id ? "Winner" : "Loser"}
              </span>

              {/* Role: Dealer / Seller / Player */}
              <span className="text-yellow-400 text-xs font-bold uppercase">
                {player.id === dealer
                  ? "Dealer"
                  : player.id === seller.id
                  ? "Seller"
                  : "Player"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

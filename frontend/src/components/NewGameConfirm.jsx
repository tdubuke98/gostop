import React, { useState, useEffect } from "react";
import { usePlayers } from "../context/PlayerContext";

export default function NewGameConfirm({playing, dealer, seller, winner}) {
  const { players } = usePlayers();

  return (
    <div className="flex flex-col overflow-y-auto gap-4">
      <h3 className="text-xl font-semibold text-white">
        Confirmation
      </h3>

      <div className="flex flex-row gap-4 h-full overflow-y-auto">
        <div className="flex flex-col gap-4 w-full shadow-inner">
          {playing.map((p) => {
            const player = players.find(player => player.id === p.id);
            return (
              <div key={player.id} className="flex flex-row items-center justify-between rounded px-4 py-2 transition duration-200 bg-gray-700 hover:bg-gray-600">
                <div className="grid grid-cols-3 w-full items-center">
                <div className="flex flex-col">
                  <span className="text-white font-semibold">{player.name}</span>
                  <span className="text-gray-300 italic text-sm">{player.username}</span>
                </div>

                <span className="text-yellow-400 text-right font-bold text-xs uppercase">
                  {player.id === winner.id
                    ? "Winner"
                    : "Loser"}
                </span>

                <span className="text-yellow-400 text-right font-bold text-xs uppercase">
                  {player.id === dealer
                    ? "Dealer"
                    : player.id === seller.id
                    ? "Seller"
                    : "Player"}
                </span>
              </div>
              </div>
          )})}
        </div>
      </div>
    </div>
  );
}

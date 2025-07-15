import React, { useState, useEffect } from "react";
import { usePlayers } from "../context/PlayerContext";

export default function NewGameSeller({ playing, dealer, seller, setSeller }) {
  const { players } = usePlayers();

  const handleSelect = (playerId) => {
    if (seller.id === playerId) {
      setSeller( prev => ({...prev, id: null}) );
    } else {
      setSeller( prev => ({...prev, id: playerId}) );
    }
  };

  const handlePointsChange = (e) => {
    setSeller( prev => ({...prev, points: e.target.value}) );
  };

  return (
    <div className="flex flex-col overflow-y-auto gap-4">
      <h3 className="text-xl font-semibold text-white">
        Select Seller/Folder
      </h3>

      <div className="flex flex-row gap-4 h-full overflow-y-auto">
        <div className="flex flex-col gap-4 w-full shadow-inner">

          {playing.map((p) => {
            const player = players.find(player => player.id === p.id);
            return (
              <div
                key={player.id}
                onClick={() => {
                  if (player.id !== dealer) {
                    handleSelect(player.id);
                  }
                }}
                className={`flex flex-row items-center justify-between rounded px-4 py-2 transition duration-200
                  ${ dealer === player.id
                      ? "bg-gray-500 opacity-50 cursor-not-allowed"
                      : seller.id === player.id
                      ? "bg-green-600 cursor-pointer"
                      : "bg-gray-700 hover:bg-gray-600 cursor-pointer"
                  }
                `}
              >
                <div className="flex flex-col">
                  <span className="text-white font-semibold">{player.name}</span>
                  <span className="text-gray-300 italic text-sm">{player.username}</span>
                </div>

                {seller.id === player.id && (
                  <input
                    type="number"
                    value={seller.points}
                    onChange={handlePointsChange}
                    onClick={(e) => e.stopPropagation()}
                    className="ml-4 p-2 w-24 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Points"
                  />
                )}

                <span className="text-yellow-400 font-bold text-xs uppercase">
                  {player.id === dealer
                    ? "Dealer"
                    : player.id === seller.id
                    ? "Seller"
                    : "Player"}
                </span>
              </div>
          )})}
        </div>
      </div>
    </div>
  );
}

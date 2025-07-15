import React, { useState, useEffect } from "react";
import { usePlayers } from "../context/PlayerContext";

export default function NewGameScore({ playing, setPlaying, dealer, seller, winner, setWinner, setNextDisabled }) {
  const { players } = usePlayers();

  useEffect(() => {
    setNextDisabled(winner.id === null);
  }, [winner, setNextDisabled]);

  const handleSelect = (playerId) => {
    if (winner.id === playerId) {
      setWinner( prev => ({...prev, id: null}) );
    } else {
      setWinner( prev => ({...prev, id: playerId}) );
    }
  };

  const handleMultiplierChange = (playerId, value) => {
    setPlaying(prevPlaying =>
      prevPlaying.map(player =>
        player.id === playerId
          ? { ...player, multiplier: value }
          : player
      )
    );
  }

  const handlePointsChange = (e) => {
    setWinner( prev => ({...prev, points: e.target.value}) );
  };

  const handleLockToggle = (playerId) => {
    setPlaying(prevPlaying =>
      prevPlaying.map(player =>
        player.id === playerId
          ? { ...player, frl: !player.frl } // toggle frl
          : player
      )
    );
  };

  return (
    <div className="flex flex-col overflow-y-auto gap-4">
      <h3 className="text-xl font-semibold text-white">Select Winner</h3>

      <div className="flex flex-row gap-4 h-full overflow-y-auto">
        <div className="flex flex-col gap-4 w-full shadow-inner">
          {playing.map((p) => {
            const player = players.find(player => player.id === p.id);
            return (
              <div
                key={player.id}
                className={`flex flex-row items-center justify-between rounded px-4 py-2 transition duration-200
                  ${ winner.id === player.id 
                    ? "bg-green-600"
                    : seller.id === player.id
                    ? "bg-gray-500 opacity-50 cursor-not-allowed"
                    : "bg-gray-700 hover:bg-gray-600" }
                `}
              >
                {/* Only this block triggers selection */}
                <div className="grid grid-cols-4 gap-6 items-center w-full rounded">

                    {/* Player info */}
                    <div
                        onClick={() => {
                        if (player.id !== seller.id) {
                            handleSelect(player.id);
                        }
                        }}
                        className="flex flex-col cursor-pointer"
                    >
                        <span className="text-white">{player.name}</span>
                        <span className="text-gray-300 italic text-sm">{player.username}</span>
                    </div>

                    {/* Multiplier or Points */}
                    <div className="flex items-center justify-end">
                        {winner.id !== null && winner.id !== player.id && seller.id !== player.id && (
                        <label className="flex items-center space-x-2">
                            <span className="text-gray-300 text-sm">Multiplier</span>
                            <input
                            type="number"
                            value={p.multiplier}
                            onChange={(e) => handleMultiplierChange(player.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-4 p-2 w-24 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Multiplier"
                            />
                        </label>
                        )}

                        {winner.id === player.id && (
                        <label className="flex items-center space-x-2">
                            <span className="text-gray-300 text-sm">Points</span>
                            <input
                            type="number"
                            value={winner.points}
                            onChange={handlePointsChange}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-4 p-2 w-24 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Points"
                            />
                        </label>
                        )}
                    </div>

                    {/* First Round Lock */}
                    <div className="flex items-center justify-end">
                        {seller.id !== player.id && (
                        <label className="flex items-center space-x-2">
                            <span className="text-gray-300 text-sm">First Round Lock</span>
                            <input
                            type="checkbox"
                            checked={p.frl}
                            onChange={() => {
                                if (player.id !== seller.id) {
                                handleLockToggle(player.id);
                                }
                            }}
                            className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </label>
                        )}
                    </div>

                    {/* Role label */}
                    <span className="text-yellow-400 font-bold text-xs uppercase text-right">
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

import React, { useState, useEffect } from "react";
import { usePlayers } from "../context/PlayerContext";

export default function NewGameDealer({ playing, dealer, setDealer, setNextDisabled }) {
  const { players } = usePlayers();

  useEffect(() => {
    setNextDisabled(dealer === null);
  }, [dealer, setNextDisabled]);

  const handleSelect = (playerId) => {
    if (dealer === playerId) {
      setDealer(null); // unselect if clicked again
    } else {
      setDealer(playerId); // set as dealer
    }
  };

  return (
    <div className="flex flex-col overflow-y-auto gap-4">
      <h3 className="text-xl font-semibold text-white">
        Select Dealer
      </h3>

      <div className="flex flex-row gap-4 h-full overflow-y-auto">
        <div className="flex flex-col gap-4 w-full shadow-inner">
          {playing.map((p) => {
            const player = players.find(player => player.id === p.id);
            return (
              <div
                key={player.id}
                onClick={() => handleSelect(player.id)}
                className={`flex flex-row items-center justify-between rounded px-4 py-2 cursor-pointer transition duration-200
                  ${
                    dealer === player.id
                      ? "bg-green-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }
                `}
              >
                <div className="flex flex-col">
                  <span className="text-white">{player.name}</span>
                  <span className="text-gray-300 italic text-sm">{player.username}</span>
                </div>
              </div>
          )})}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { usePlayers } from "../context/PlayerContext";
import { ArrowLeftRight, UserRoundPlus, UserMinus } from "lucide-react";

export default function NewGamePlayers( {playing, setPlaying, setNextDisabled} ) {
  const { players } = usePlayers();

  useEffect(() => {
    setNextDisabled(playing.length < 2);
  }, [playing, setNextDisabled]);

  const handlePlaying = (id) => {
    const selected = players.find((p) => p.id === id);
    if (selected && !playing.some((p) => p.id === selected.id)) {
      const newPlaying = [...playing, {id: selected.id, frl: false, multiplier: 1, roleId: null}];
      setPlaying(newPlaying);
    }
  };

  const handleRemove = (id) => {
    const newPlaying = playing.filter((p) => p.id !== id);
    setPlaying(newPlaying);
  };

  const availablePlayers = players.filter(
    (player) => !playing.some((p) => p.id === player.id)
  );

  return (
      <div className="flex flex-col flex-grow overflow-y-auto gap-4">
        <h3 className="text-xl font-semibold text-white">
          New Game
        </h3>

        <div className="flex flex-row gap-4 h-full justify-between overflow-y-auto">

          {/* Available Players Table */}
          <div className="flex flex-col gap-4 flex-grow shadow-inner">

            <h3 className="flex font-semibold text-white">
              Select Players
            </h3>

            <div className="flex rounded-lg bg-gray-700 overflow-y-auto shadow-inner">
              <table className="w-full text-sm text-center text-gray-400 overflow-y-auto">
                <thead className="sticky top-0 text-xs uppercase bg-gray-600">
                  <tr>
                    <td className="px-4 py-2 text-left">Name</td>
                    <td className="px-4 py-2">Add</td>
                  </tr>
                </thead>
                <tbody>
                  {availablePlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="odd:bg-gray-800 even:bg-gray-700 border-b border-gray-600"
                    >
                      <td className="px-4 py-2">
                        <div className="flex flex-col text-left">
                          <span className="text-white">{player.name}</span>
                          <span className="text-gray-400 italic text-sm">{player.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handlePlaying(player.id)}
                          disabled={playing.length >= 4}
                          className={`${
                            playing.length >= 4
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-500 hover:bg-green-600"
                            } text-white rounded px-2 py-1`}
                        >
                          <UserRoundPlus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center content-center justify-center flex-none">
            <ArrowLeftRight className="w-12 h-12 text-white" />
          </div>

          {/* Selected Players */}
          <div className="flex flex-col gap-4 flex-grow shadow-inner">

            <h3 className="flex font-semibold text-white">
              Selected Players
            </h3>

            <div className="flex rounded-lg overflow-y-auto shadow-inner">
              <table className="w-full text-sm bg-gray-700 text-center text-gray-400 overflow-y-auto">
                <thead className="sticky top-0 text-xs uppercase bg-gray-600">
                  <tr>
                    <td className="px-4 py-2 text-left">Name</td>
                    <td className="px-4 py-2">Remove</td>
                  </tr>
                </thead>
                <tbody>
                  {playing.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-4 text-gray-300">
                        No players selected
                      </td>
                    </tr>
                  ) : (
                    playing.map((p) => {
                      const player = players.find(player => player.id === p.id);
                      return (
                        <tr
                          key={player.id}
                          className="odd:bg-gray-800 even:bg-gray-700 border-b border-gray-600"
                        >
                          <td className="px-4 py-2">
                            <div className="flex flex-col text-left">
                              <span className="text-white">{player.name}</span>
                              <span className="text-gray-400 italic text-sm">{player.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleRemove(player.id)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  );
}

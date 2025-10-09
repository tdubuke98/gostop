import React, { useState, useEffect } from "react";
import { usePlayers } from "../context/PlayerContext";
import { ArrowLeftRight, UserRoundPlus, UserMinus, Search } from "lucide-react";

export default function NewGamePlayers({ metadata, setMetadata, setNextDisabled }) {
  const { players } = usePlayers();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setNextDisabled(metadata.playing.length < 2);
  }, [metadata.playing, setNextDisabled]);

  const handlePlaying = (id) => {
    const selected = players.find((p) => p.id === id);
    if (selected && !metadata.playing.some((p) => p.id === selected.id)) {
      const newPlaying = [
        ...metadata.playing,
        { id: selected.id, frl: false, multiplier: 1 },
      ];
      setMetadata( prevMetadata => ({...prevMetadata, playing: newPlaying }));
    }
  };

  const handleRemove = (id) => {
    const newPlaying = metadata.playing.filter((p) => p.id !== id);
    setMetadata( prevMetadata => ({...prevMetadata, playing: newPlaying}));
  };

  // Available players filtered by search and not already selected
  const availablePlayers = players.filter(
    (player) =>
      !metadata.playing.some((p) => p.id === player.id) &&
      (player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">
      <h3 className="text-xl font-semibold text-white">
        {metadata.gameId !== null ? 'Edit Game' : 'New Game'}
      </h3>

      <div className="flex flex-col lg:flex-row gap-4 h-full justify-between overflow-y-auto">

        {/* Available Players */}
        <div className="flex-1 flex flex-col shadow-inner rounded-lg h-full">

          {/* Search bar */}
          <div className="relative py-2 px-2 flex-none">
            <Search className="absolute top-3.5 left-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-1 rounded bg-gray-800 text-white text-sm focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 shadow-inner rounded-lg overflow-y-auto">
            <table className="w-full text-sm text-center text-gray-400">
              <thead className="sticky top-0 text-xs uppercase bg-gray-600">
                <tr>
                  <td className="px-4 py-2 text-left">Name</td>
                  <td className="px-4 py-2">Add</td>
                </tr>
              </thead>
              <tbody>
                {availablePlayers.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-4 py-4 text-gray-300">
                      No players found
                    </td>
                  </tr>
                ) : (
                  availablePlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="odd:bg-gray-800 even:bg-gray-700 border-b border-gray-600"
                    >
                      <td className="px-4 py-2">
                        <div className="flex flex-col text-left">
                          <span className="text-white">{player.name}</span>
                          <span className="text-gray-400 italic text-sm">
                            {player.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handlePlaying(player.id)}
                          disabled={metadata.playing.length >= 4}
                          className={`${metadata.playing.length >= 4
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-500 hover:bg-green-600"
                            } text-white rounded px-2 py-1`}
                        >
                          <UserRoundPlus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Arrow (desktop only) */}
        <div className="hidden lg:flex items-center justify-center flex-none">
          <ArrowLeftRight className="w-12 h-12 text-white" />
        </div>

        {/* Selected Players */}
        <div className="flex-1 flex-col h-full shadow-inner">
          <h3 className="flex px-2 py-2.5 font-semibold text-white"> Selected Players </h3>

          <div className="flex rounded-lg overflow-y-auto shadow-inner max-h-64 lg:max-h-none">
            <table className="w-full text-sm bg-gray-700 text-center text-gray-400">
              <thead className="sticky top-0 text-xs uppercase bg-gray-600">
                <tr>
                  <td className="px-4 py-2 text-left">Name</td>
                  <td className="px-4 py-2">Remove</td>
                </tr>
              </thead>
              <tbody>
                {metadata.playing.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-4 text-gray-300">
                      No players selected
                    </td>
                  </tr>
                ) : (
                  metadata.playing.map((p) => {
                    const player = players.find((pl) => pl.id === p.id);
                    return (
                      <tr
                        key={player.id}
                        className="odd:bg-gray-800 even:bg-gray-700 border-b border-gray-600"
                      >
                        <td className="px-4 py-2">
                          <div className="flex flex-col text-left">
                            <span className="text-white">{player.name}</span>
                            <span className="text-gray-400 italic text-sm">
                              {player.username}
                            </span>
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

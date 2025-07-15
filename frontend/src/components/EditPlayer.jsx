import React, { useState, useEffect } from "react";
import { usePlayers } from "../context/PlayerContext";

export default function EditPlayer({ setEditPlayerId, editPlayerId }) {
  const { players, addPlayer, deletePlayer, editPlayer } = usePlayers();
  const [error, setError] = useState("");

  const player = players.find((p) => p.id === editPlayerId);

  const [name, setName] = useState(player ? player.name : "");
  const [username, setUsername] = useState(player ? player.username : "");

  useEffect(() => {
    if (player) {
      setName(player.name);
      setUsername(player.username);
    }
  }, [player]);

  const handleSave = async (id) => {
    setError("");

    try {
      await editPlayer(id, name, username);
      setEditPlayerId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError("");
        
    try {
      await deletePlayer(id);
      setEditPlayerId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Edit Player
        </h3>

        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />

        <div className="flex flex-row justify-end gap-1 space-x-2">
          <button
            onClick={() => handleDelete(editPlayerId)}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white transition"
          >
            Delete
          </button>
          <button
            onClick={() => setEditPlayerId(null)}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(editPlayerId)}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

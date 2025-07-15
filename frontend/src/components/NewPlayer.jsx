import React, { useState } from "react";
import { usePlayers } from "../context/PlayerContext";

export default function NewPlayer({ setShowNewPlayer }) {
  const { players, addPlayer } = usePlayers();
  const [newPlayer, setNewPlayer] = useState("");
  const [newPlayerUsername, setNewPlayerUsername] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!newPlayer.trim() || !newPlayerUsername.trim()) {
      setError("Both name and username are required.");
      return;
    }

    // Call parent's addPlayer function
    try {
      await addPlayer(newPlayer.trim(), newPlayerUsername.trim());
      
      setNewPlayer("");
      setNewPlayerUsername("");
      setShowNewPlayer(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Create New Player
        </h3>

        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Name"
          className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <input
          type="text"
          value={newPlayerUsername}
          onChange={(e) => setNewPlayerUsername(e.target.value)}
          placeholder="Username"
          className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />

        <div className="flex flex-row justify-end gap-1 space-x-2">
          <button
            onClick={() => setShowNewPlayer(false)}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

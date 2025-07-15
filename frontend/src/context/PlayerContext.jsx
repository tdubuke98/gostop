// PlayerContext.js
import React, { useContext, createContext, useState, useEffect } from "react";
import config from "../utils/api.js";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [players, setPlayers] = useState([]);

  const fetchAllPlayers = () => {
    fetch(`${config.backendURI}/players`)
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error("Failed to fetch players:", err));
  };

  useEffect(() => {
    fetchAllPlayers();
  }, []);

  const deletePlayer = async (id) => {
    try {
      const res = await fetch(`${config.backendURI}/players/${id}`, { method: "DELETE" });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete player");
      }

      setPlayers(players.filter((p) => p.id !== id))
    } catch (err) {
      throw err;
    }
  };

  const addPlayer = async (newPlayer, newPlayerUsername) => {
    try {
      const res = await fetch(`${config.backendURI}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlayer, username: newPlayerUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Backend returned error (e.g. 400 duplicate username)
        throw new Error(data.error || "Failed to add player");
      }

      setPlayers([...players, data]);
    } catch (err) {
      console.error("Add player failed:", err);
      throw err;
    }
  };
    
  const editPlayer = async (id, updatedName, updatedUsername) => {
    try {
      const res = await fetch(`${config.backendURI}/players/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedName,
          username: updatedUsername,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Backend returned error (e.g. duplicate username)
        throw new Error(data.error || "Failed to edit player");
      }

      // Update local state by replacing the edited player
      setPlayers(players.map((p) => (p.id === id ? data : p)));

      return data; // return updated player for any further usage
    } catch (err) {
      console.error("Edit player failed:", err);
      throw err;
    }
  };

  return (
    <PlayerContext.Provider value={{ players, addPlayer, deletePlayer, editPlayer, fetchAllPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => useContext(PlayerContext);

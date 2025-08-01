// PlayerContext.js
import React, { useContext, createContext, useState, useEffect } from "react";
import { sendREST } from "../utils/api.js";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [players, setPlayers] = useState([]);

  async function fetchAllPlayers() {
    try {
      const data = await sendREST("/api/players");
      setPlayers(data);
    } catch (error) {
      console.error("Fetching players failed:", error);
    }
  };

  const addPlayer = async (newPlayer, newPlayerUsername) => {
    try {
      const data = await sendREST("/api/players", { name: newPlayer, username: newPlayerUsername }, "POST")
      setPlayers([...players, data]);
    } catch (err) {
      console.error("Add player failed:", err);
      throw err;
    }
  };

  const deletePlayer = async (id) => {
    try {
      const data = await sendREST(`/api/players/${id}`, undefined, "DELETE")
      setPlayers(players.filter((p) => p.id !== id))
    } catch (err) {
      console.error("Delete player failed:", err);
      throw err;
    }
  };

  const editPlayer = async (id, updatedName, updatedUsername) => {
    try {
      const data = await sendREST(`/api/players/${id}`, { name: updatedName, username: updatedUsername }, "PATCH");
      setPlayers(players.map((p) => (p.id === id ? data : p)));
    } catch (err) {
      console.error("Edit player failed:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAllPlayers();
  }, []);
    
  return (
    <PlayerContext.Provider value={{ players, addPlayer, deletePlayer, editPlayer, fetchAllPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => useContext(PlayerContext);

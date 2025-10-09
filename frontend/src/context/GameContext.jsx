// GameContext.js
import React, { useContext, createContext, useState, useEffect } from "react";
import { usePlayers } from "./PlayerContext";
import { sendREST } from "../utils/api.js";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [numGames, setNumGames] = useState(0);
  const { fetchAllPlayers } = usePlayers();

  async function fetchNumGames() {
    try {
      const data = await sendREST("/num_games");
      setNumGames(data);
    } catch (error) {
      console.error("Fetching number of games failed:", error);
    }
  }

  async function fetchAllGames() {
    try {
      const data = await sendREST("/games");
      setGames(data);
    } catch (error) {
      console.error("Fetching games failed:", error);
    }
  };

  const getGameForEdit = async (id) => {
    try {
      const resp = await sendREST(`/games/${id}`, undefined, "GET");
      return resp;
    } catch (error) {
      console.error("Failed to fetch game for edit:", error);
    }
  }

  const sendNewGame = async (payload) => {
    try {
      const newGames = await sendREST(`/games/new_game`, payload, "POST")
      const existingIndex = games.findIndex((g) => g.game_id === newGames[0].game_id);

      if (existingIndex !== -1) {
        const updatedGames = [...games];
        updatedGames[existingIndex] = newGames[0];
        setGames(updatedGames);
      } else {
        setGames([...newGames, ...games]);
      }
    } catch (err) {
      console.error("Create game failed:", err);
      throw err;
    }

    // Gotta update the players and their balances when we delete a game
    fetchAllPlayers();
    fetchNumGames();
  }

  const deleteGame = async (id) => {
    try {
      const data = await sendREST(`/games/${id}`, undefined, "DELETE")
      setGames(games.filter((g) => g.game_id !== id));
    } catch (err) {
      console.error("Delete game failed:", err);
      throw err;
    }

    // Gotta update the players and their balances when we delete a game
    fetchAllPlayers();
    fetchNumGames();
  };

  async function reloadBalances() {
    try {
      await sendREST("/update", undefined, "PATCH")
    } catch (err) {
      console.error("Reload balances failed:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAllGames();
    fetchNumGames();
  }, []);

  return (
    <GameContext.Provider value={{ games, sendNewGame, reloadBalances, deleteGame, numGames, getGameForEdit }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGames = () => useContext(GameContext);

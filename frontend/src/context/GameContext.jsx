// GameContext.js
import React, { useContext, createContext, useState, useEffect } from "react";
import { usePlayers } from "./PlayerContext";
import config, { sendREST } from "../utils/api.js";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const { fetchAllPlayers } = usePlayers();

  async function fetchAllGames() {
    try {
      const data = await sendREST("/games");
      setGames(data);
    } catch (error) {
      console.error("Fetching games failed:", error);
    }
  };

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
  };

  const createGame = async (winner_id) => {
    try {
      const data = await sendREST("/games", { winner_id: winner_id }, "POST")
      return data;
    } catch (err) {
      console.error("Create game failed:", err);
      throw err;
    }
  }

  async function reloadBalances() {
    try {
      await sendREST("/update", undefined, "PATCH")
    } catch (err) {
      console.error("Reload balances failed:", err);
      throw err;
    }
  };

  const updateGameBalance = async (gameId) => {
    try {
      await sendREST(`/update/${gameId}`, undefined, "PATCH")
    } catch (err) {
      console.error("Update game balances failed:", err);
      throw err;
    }
  };

  const fetchNewGame = async (gameId) => {
    try {
      const game = await sendREST(`/games/${gameId}`, undefined, "GET")
      setGames([...game, ...games])
    } catch (err) {
      console.error("Create game failed:", err);
      throw err;
    }

    // Gotta update the players and their balances when we delete a game
    fetchAllPlayers();
  }

  useEffect(() => {
    fetchAllGames();
  }, []);

  return (
    <GameContext.Provider value={{ games, updateGameBalance, fetchNewGame, reloadBalances, createGame, deleteGame }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGames = () => useContext(GameContext);

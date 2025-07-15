// GameContext.js
import React, { useContext, createContext, useState, useEffect } from "react";
import { usePlayers } from "./PlayerContext";
import config from "../utils/api.js";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const { fetchAllPlayers } = usePlayers();

  useEffect(() => {
    fetch(`${config.backendURI}/games`)
      .then((res) => res.json())
      .then((data) => setGames(data))
      .catch((err) => console.error("Failed to fetch games:", err));
  }, []);

  const deleteGame = async (id) => {
    await fetch(`${config.backendURI}/games/${id}`, { method: "DELETE" });

    setGames(games.filter((g) => g.game_id !== id));

    fetchAllPlayers();
  };

  const createGame = async (winner_id) => {
    const gameRes = await fetch(`${config.backendURI}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        winner_id: winner_id
      }),
    });

    const gameId = await gameRes.json();
    return gameId;
  }

  const fetchNewGame = async (gameId) => {
    const gameDataRes = await fetch(`${config.backendURI}/games/${gameId}`, {method: "GET"});
    const game = await gameDataRes.json();

    setGames([...game, ...games])

    fetchAllPlayers();
  }

  return (
    <GameContext.Provider value={{ games, fetchNewGame, createGame, deleteGame }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGames = () => useContext(GameContext);

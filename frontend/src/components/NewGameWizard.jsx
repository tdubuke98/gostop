import React, { useState } from "react";
import { usePlayers } from "../context/PlayerContext";
import { useGames } from "../context/GameContext";
import NewGamePlayers from "./NewGamePlayers";
import NewGameDealer from "./NewGameDealer";
import NewGameSeller from "./NewGameSeller";
import NewGameScore from "./NewGameScore";
import NewGameConfirm from "./NewGameConfirm";
import { sendREST } from "../utils/api.js";

export const WizardPage = {
  SELECT_PLAYERS: "SELECT_PLAYERS",
  CHOOSE_DEALER: "CHOOSE_DEALER",
  CHOOSE_SELLER: "CHOOSE_SELLER",
  SCORE_RESULTS: "SCORE_RESULTS",
  CONFIRM: "CONFIRM",
};

export default function NewGameWizard({ setShowNewGame }) {
  const { players } = usePlayers();
  const { createGame, updateGameBalance, fetchNewGame } = useGames();

  const [currentPage, setCurrentPage] = useState(WizardPage.SELECT_PLAYERS);
  const [nextDisabled, setNextDisabled] = useState(false);

  const [playing, setPlaying] = useState([]);
  const [dealer, setDealer] = useState(null);
  const [seller, setSeller] = useState({ id: null, points: 0 });
  const [winner, setWinner] = useState({ id: null, points: 0 });

  const handleSave = async () => {
    let updatedPlaying = [...playing];

    let gameId = await createGame(winner.id);

    for (const player of updatedPlaying) {
      let role = "PLAYER";

      if (player.id === dealer) {
        role = "DEALER";
      } else if (player.id === seller.id) {
        role = "SELLER";
      }

      const roleId = await sendREST(`/api/roles/${gameId}`, { role: role, player_id: player.id }, "POST" );

      updatedPlaying = updatedPlaying.map(p =>
        player.id === p.id
          ? { ...p, roleId: roleId }
          : p
      );
    }

    // If we have a first round lock, we should send updates for all other players
    for (const player of updatedPlaying) {
      if (player.frl) {
        await sendREST(`/api/points_events/${player.roleId}`, { event_type: "FIRST_ROUND_LOCK", points: 5 }, "POST" );
      }

      if (player.id === winner.id) {
        await sendREST(`/api/points_events/${player.roleId}`, { event_type: "WIN", points: winner.points }, "POST" );
        continue;
      }

      if (player.id === seller.id && seller.points > 0) {
        await sendREST(`/api/points_events/${player.roleId}`, { event_type: "SELL", points: seller.points }, "POST" );
        continue;
      }

      await sendREST(`/api/points_events/${player.roleId}`, { event_type: "LOSS_MULTIPLIER", points: player.multiplier }, "POST" );
    }

    await updateGameBalance(gameId);
    await fetchNewGame(gameId);

    // Reset the game state
    setPlaying([]);
    setDealer(null);
    setSeller(null);
    setWinner(null);
    setShowNewGame(false);
  }

  const handleNext = () => {
    switch (currentPage) {
      case WizardPage.SELECT_PLAYERS:
        setCurrentPage(WizardPage.CHOOSE_DEALER);
        break;
      case WizardPage.CHOOSE_DEALER:
        if (playing.length === 4)
          setCurrentPage(WizardPage.CHOOSE_SELLER);
        else
          setCurrentPage(WizardPage.SCORE_RESULTS);
        break;
      case WizardPage.CHOOSE_SELLER:
        setCurrentPage(WizardPage.SCORE_RESULTS);
        break;
      case WizardPage.SCORE_RESULTS:
        setCurrentPage(WizardPage.CONFIRM);
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    switch (currentPage) {
      case WizardPage.CHOOSE_DEALER:
        setCurrentPage(WizardPage.SELECT_PLAYERS);
        break;
      case WizardPage.CHOOSE_SELLER:
        setCurrentPage(WizardPage.CHOOSE_DEALER);
        break;
      case WizardPage.SCORE_RESULTS:
        if (playing.length === 4)
          setCurrentPage(WizardPage.CHOOSE_SELLER);
        else
          setCurrentPage(WizardPage.CHOOSE_DEALER);
        break;
      case WizardPage.CONFIRM:
        setCurrentPage(WizardPage.SCORE_RESULTS);
        break;
      default:
        break;
    }
  };

  const handleCancel = () => {
    setPlaying([]);
    setDealer(null);
    setSeller(null);
    setWinner(null);
    setShowNewGame(false);
  };

  return (
    <div className="flex fixed inset-0 bg-black bg-opacity-50 justify-center items-center z-50">
      <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg p-6 gap-4 w-1/2 h-1/2 justify-between">
        {currentPage === WizardPage.SELECT_PLAYERS && <NewGamePlayers playing={playing} setPlaying={setPlaying} setNextDisabled={setNextDisabled} />}
        {currentPage === WizardPage.CHOOSE_DEALER && <NewGameDealer playing={playing} setDealer={setDealer} dealer={dealer} setNextDisabled={setNextDisabled} />}
        {currentPage === WizardPage.CHOOSE_SELLER && <NewGameSeller playing={playing} dealer={dealer} seller={seller} setSeller={setSeller} />}
        {currentPage === WizardPage.SCORE_RESULTS && <NewGameScore
                  playing={playing}
                  setPlaying={setPlaying}
                  dealer={dealer}
                  seller={seller}
                  winner={winner}
                  setWinner={setWinner}
                  setNextDisabled={setNextDisabled}
                />}
        {currentPage === WizardPage.CONFIRM && <NewGameConfirm playing={playing} dealer={dealer} seller={seller} winner={winner} />}

        <div className="flex flex-row justify-end gap-1 space-x-2">
          <button
            onClick={handleBack}
            disabled={currentPage === WizardPage.SELECT_PLAYERS}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white transition"
          >
            Previous
          </button>

          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white transition"
          >
            Cancel
          </button>

          {currentPage !== WizardPage.CONFIRM && (
            <button
              onClick={handleNext}
              disabled={nextDisabled}
              className={`${ nextDisabled
                           ? "bg-gray-400 cursor-not-allowed"
                           : "bg-blue-600 hover:bg-blue-700"
                         } px-4 py-2 rounded text-white transition`}
            >
              Next
            </button>
          )}

          {currentPage === WizardPage.CONFIRM && (
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

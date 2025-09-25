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
  const { createGame, updateGameBalance, sendNewGame } = useGames();

  const [currentPage, setCurrentPage] = useState(WizardPage.SELECT_PLAYERS);
  const [nextDisabled, setNextDisabled] = useState(false);

  const [playing, setPlaying] = useState([]);
  const [dealer, setDealer] = useState(null);
  const [seller, setSeller] = useState({ id: null, points: 0 });
  const [winner, setWinner] = useState({ id: null, points: 0 });

  const handleSave = async () => {
    const payload = {
      winner_id: winner.id,
      players: [],
    };

    for (const player of playing) {
      let role = "PLAYER";

      if (player.id === dealer) role = "DEALER";
      else if (player.id === seller.id) role = "SELLER";

      const pointsEvents = [];

      if (player.frl) {
        pointsEvents.push({ event_type: "FIRST_ROUND_LOCK", points: 5 });
      }

      if (player.id === winner.id) {
        pointsEvents.push({ event_type: "WIN", points: winner.points });
      } else if (player.id === seller.id) {
        pointsEvents.push({ event_type: "SELL", points: seller.points });
      } else {
        pointsEvents.push({ event_type: "LOSS_MULTIPLIER", points: player.multiplier });
      }

      payload.players.push({
        id: player.id,
        role,
        points_events: pointsEvents,
      });
    }

    await sendNewGame(payload);

    setPlaying([]);
    setDealer(null);
    setSeller(null);
    setWinner(null);
    setShowNewGame(false);
  };

  const handleNext = () => {
    switch (currentPage) {
      case WizardPage.SELECT_PLAYERS:
        setCurrentPage(WizardPage.CHOOSE_DEALER);
        break;
      case WizardPage.CHOOSE_DEALER:
        setCurrentPage(playing.length === 4 ? WizardPage.CHOOSE_SELLER : WizardPage.SCORE_RESULTS);
        break;
      case WizardPage.CHOOSE_SELLER:
        setCurrentPage(WizardPage.SCORE_RESULTS);
        break;
      case WizardPage.SCORE_RESULTS:
        setCurrentPage(WizardPage.CONFIRM);
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
        setCurrentPage(playing.length === 4 ? WizardPage.CHOOSE_SELLER : WizardPage.CHOOSE_DEALER);
        break;
      case WizardPage.CONFIRM:
        setCurrentPage(WizardPage.SCORE_RESULTS);
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
      <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg 
                      w-full h-full sm:w-3/4 sm:h-3/4 lg:w-1/2 lg:h-1/2 
                      p-4 sm:p-6 gap-4 overflow-y-auto">
        
        {/* Wizard Pages */}
        {currentPage === WizardPage.SELECT_PLAYERS && (
          <NewGamePlayers
            playing={playing}
            setPlaying={setPlaying}
            setNextDisabled={setNextDisabled}
          />
        )}
        {currentPage === WizardPage.CHOOSE_DEALER && (
          <NewGameDealer
            playing={playing}
            setDealer={setDealer}
            dealer={dealer}
            setNextDisabled={setNextDisabled}
          />
        )}
        {currentPage === WizardPage.CHOOSE_SELLER && (
          <NewGameSeller
            playing={playing}
            dealer={dealer}
            seller={seller}
            setSeller={setSeller}
          />
        )}
        {currentPage === WizardPage.SCORE_RESULTS && (
          <NewGameScore
            playing={playing}
            setPlaying={setPlaying}
            dealer={dealer}
            seller={seller}
            winner={winner}
            setWinner={setWinner}
            setNextDisabled={setNextDisabled}
          />
        )}
        {currentPage === WizardPage.CONFIRM && (
          <NewGameConfirm
            playing={playing}
            dealer={dealer}
            seller={seller}
            winner={winner}
          />
        )}

        {/* Controls */}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={handleBack}
            disabled={currentPage === WizardPage.SELECT_PLAYERS}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white transition disabled:opacity-50"
          >
            Previous
          </button>

          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white transition"
          >
            Cancel
          </button>

          {currentPage !== WizardPage.CONFIRM ? (
            <button
              onClick={handleNext}
              disabled={nextDisabled}
              className={`${nextDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                } px-4 py-2 rounded text-white transition`}
            >
              Next
            </button>
          ) : (
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

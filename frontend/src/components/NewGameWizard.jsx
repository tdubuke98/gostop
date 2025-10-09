import React, { useState, useEffect } from "react";
import { useGames } from "../context/GameContext";
import NewGamePlayers from "./NewGamePlayers";
import NewGameDealer from "./NewGameDealer";
import NewGameSeller from "./NewGameSeller";
import NewGameScore from "./NewGameScore";
import NewGameConfirm from "./NewGameConfirm";

export const WizardPage = {
  SELECT_PLAYERS: "SELECT_PLAYERS",
  CHOOSE_DEALER: "CHOOSE_DEALER",
  CHOOSE_SELLER: "CHOOSE_SELLER",
  SCORE_RESULTS: "SCORE_RESULTS",
  CONFIRM: "CONFIRM",
};

export default function NewGameWizard({ setShowGameWizard, editGameId, setEditGameId }) {
  const { sendNewGame, deleteGame, getGameForEdit } = useGames();

  const [currentPage, setCurrentPage] = useState(WizardPage.SELECT_PLAYERS);
  const [nextDisabled, setNextDisabled] = useState(false);

  const [metadata, setMetadata] = useState({
    playing: [], 
    gameId: null,
    dealer: null, 
    seller: {id: null, points: 0}, 
    winner: {id: null, points: 0}
  });

  useEffect(() => {
    const fetchGameForEdit = async () => {
      if (editGameId !== null) {
        const game = await getGameForEdit(editGameId);
        setMetadata(game);
      }
    };

    fetchGameForEdit();
  }, []);

  const handleDelete = async (id) => {
    await deleteGame(id);

    setEditGameId(null);
    setShowGameWizard(false);
  };

  const handleSave = async () => {
    await sendNewGame(metadata);

    setEditGameId(null);
    setShowGameWizard(false);
  };

  const handleNext = () => {
    switch (currentPage) {
      case WizardPage.SELECT_PLAYERS:
        setCurrentPage(WizardPage.CHOOSE_DEALER);
        break;
      case WizardPage.CHOOSE_DEALER:
        setCurrentPage(metadata.playing.length === 4 ? WizardPage.CHOOSE_SELLER : WizardPage.SCORE_RESULTS);
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
        setCurrentPage(metadata.playing.length === 4 ? WizardPage.CHOOSE_SELLER : WizardPage.CHOOSE_DEALER);
        break;
      case WizardPage.CONFIRM:
        setCurrentPage(WizardPage.SCORE_RESULTS);
        break;
    }
  };

  return (
    <div className="flex fixed inset-0 bg-black bg-opacity-50 justify-center items-center z-50">
      <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg 
                      w-full h-full sm:w-3/4 sm:h-3/4 lg:w-1/2 lg:h-1/2 
                      p-4 sm:p-6 gap-4 overflow-y-auto justify-between">
        
        {/* Wizard Pages */}
        {currentPage === WizardPage.SELECT_PLAYERS && (
          <NewGamePlayers
            metadata={metadata}
            setMetadata={setMetadata}
            setNextDisabled={setNextDisabled}
          />
        )}
        {currentPage === WizardPage.CHOOSE_DEALER && (
          <NewGameDealer
            metadata={metadata}
            setMetadata={setMetadata}
            setNextDisabled={setNextDisabled}
          />
        )}
        {currentPage === WizardPage.CHOOSE_SELLER && (
          <NewGameSeller
            metadata={metadata}
            setMetadata={setMetadata}
            setNextDisabled={setNextDisabled}
          />
        )}
        {currentPage === WizardPage.SCORE_RESULTS && (
          <NewGameScore
            metadata={metadata}
            setMetadata={setMetadata}
            setNextDisabled={setNextDisabled}
          />
        )}
        {currentPage === WizardPage.CONFIRM && (
          <NewGameConfirm
            metadata={metadata}
          />
        )}

        {/* Controls */}
        <div className="flex flex-row justify-between items-center">

          <div className="flex gap-2 justify-left">
            {metadata.gameId !== null && (
              <button
                onClick={() => handleDelete(metadata.gameId)}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white transition"
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex flex-row gap-2 justify-end">
            <button
              onClick={handleBack}
              disabled={currentPage === WizardPage.SELECT_PLAYERS}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white transition disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={() => {
                setEditGameId(null);
                setShowGameWizard(false);
              }}
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
                {metadata.gameId === null ? 'Save' : 'Update'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

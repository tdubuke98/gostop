import React, { useState, useEffect } from "react";
import { Award, ArrowBigRight, UserPlus, UserRoundCog } from "lucide-react";
import { usePlayers } from "../context/PlayerContext";

export default function Leaderboard( {setShowNewPlayer, setEditPlayerId, isAuth} ) {
  const { players, deletePlayer } = usePlayers();

  return (
    <div className="flex flex-col flex-grow bg-gray-800 shadow-lg rounded-lg gap-6 p-6">
      <div className="flex flex-row justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          Leaderboard
        </h2>

        {isAuth && (
          <button
            onClick={() => setShowNewPlayer(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-center shadow-lg rounded text-xl px-4 py-2"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col overflow-y-auto rounded-lg">
        <table className="w-full text-sm text-center rtl:text-right text-gray-400">
          <thead className="text-xs uppercase bg-gray-700 sticky top-0">
            <tr>
              <td scope="col" className="px-6 py-2">Place</td>
              <td scope="col" className="px-6 py-2">Name</td>
              <td scope="col" className="px-6 py-2">Points</td>
              {isAuth && (<td scope="col" className="px-6 py-2">Edit</td>)}
            </tr>
          </thead>
          <tbody>
            {players
              .slice()
              .sort((a, b) => b.balance - a.balance)
              .map((player, index) => {
                let medalColor = "";
                if (index === 0) medalColor = "text-yellow-400";
                else if (index === 1) medalColor = "text-gray-400";
                else if (index === 2) medalColor = "text-amber-700";

               return (
                 <tr
                   key={player.id}
                   className="odd:bg-gray-900 even:bg-gray-800 border-b border-gray-700"
                 >
                   <td className="px-6 py-3 text-center">
                     { index < 3 ? (
                       <Award className={`mx-auto ${medalColor}`} />
                     ) : (
                       <span className="px-6 py-3"> {index + 1} </span> 
                     )}
                   </td>
                   <td className="px-6 py-3">
                     <div className="flex flex-col text-left">
                       <span className="text-white">{player.name}</span>
                       <span className="text-gray-400 italic text-sm">{player.username}</span>
                     </div>
                   </td>
                   <td className="px-6 py-3"> {player.balance} </td>
                   {isAuth && (
                     <td className="px-6 py-3">
                       <button
                         onClick={() => setEditPlayerId(player.id)}
                         className="bg-blue-500 hover:bg-blue-600 content-center text-white rounded px-4 py-2"
                       >
                         <UserRoundCog className="w-5 h-5" />
                       </button>
                      </td>
                    )}
                  </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

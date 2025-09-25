import React, { useState, useEffect } from "react";
import { sendREST } from "../utils/api.js";
import StatsTheme from "../assets/gostop_stats_page.wav";
import BGM from "../components/BGM"

export default function StatsPage() {
  const [stats, setStats] = useState({
    dealer_win_percentage: 0,
    players: []
  });
  const [svgMarkup, setSvgMarkup] = useState("");

  async function fetchAllStats() {
    try {
      const data = await sendREST("/stats");
      setStats(data);

      const svgResponse = await sendREST("/player.svg");
      setSvgMarkup(svgResponse);
    } catch (error) {
      console.error("Fetching stats failed:", error);
    }
  }

  useEffect(() => {
    fetchAllStats();
  }, []);

  return (
    <div className="bg-gray-300 min-h-screen">
      <BGM url={StatsTheme}/>
      <div className="flex flex-col p-4 sm:p-6 gap-4 sm:gap-6">

        {/* Dealer Win Percentage */}
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Dealer Win Percentage:
          </h2>
          <p className="text-lg sm:text-xl text-white">{stats.dealer_win_percentage}%</p>
        </div>

        {/* Players and Game Count */}
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md overflow-x-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Player Stats</h2>
          <table className="table-auto w-full min-w-max text-sm sm:text-base text-white border-collapse">
            <thead className="text-xs uppercase bg-gray-700">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-left rounded-tl-lg">Name</th>
                <th className="px-2 sm:px-4 py-2 text-left">Games Played</th>
                <th className="px-2 sm:px-4 py-2 text-left">Win %</th>
                <th className="px-2 sm:px-4 py-2 text-left">Avg Points/Win</th>
                <th className="px-2 sm:px-4 py-2 text-left">Max Win</th>
                <th className="px-2 sm:px-4 py-2 text-left">Avg Points/Loss</th>
                <th className="px-2 sm:px-4 py-2 text-left">Max Loss</th>
                <th className="px-2 sm:px-4 py-2 text-left">Avg Sell</th>
                <th className="px-2 sm:px-4 py-2 text-left rounded-tr-lg">Max Sell</th>
              </tr>
            </thead>
            <tbody>
              {stats.players.map((player) => (
              <tr
                key={player.id}
                className="odd:bg-gray-900 even:bg-gray-800 border-b border-gray-700"
              >
                <td className="px-2 sm:px-4 py-2 text-left">
                  <div className="flex flex-col text-left">
                    <span className="text-white">{player.name}</span>
                    <span className="text-gray-400 italic text-sm">{player.username}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 text-left">{player.games_played}</td>
                <td className="px-2 sm:px-4 py-2 text-left">{player.win_percentage ?? "-"}</td>
                <td className="px-2 sm:px-4 py-2 text-left">{player.avg_points_per_win ?? "-"}</td>
                <td className="px-2 sm:px-4 py-2 text-left">{player.max_win ?? "-"}</td>
                <td className="px-2 sm:px-4 py-2 text-left">{player.avg_points_per_loss ?? "-"}</td>
                <td className="px-2 sm:px-4 py-2 text-left">{player.max_loss ?? "-"}</td>
                <td className="px-2 sm:px-4 py-2 text-left">{player.avg_sell ?? "-"}</td>
                <td className="px-2 sm:px-4 py-2 text-left">{player.max_sell ?? "-"}</td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Player Points Over Time SVG */}
        {svgMarkup && (
          <div
            className="bg-white p-2 sm:p-4 rounded-lg shadow-md overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        )}
      </div>
    </div>
  );
}

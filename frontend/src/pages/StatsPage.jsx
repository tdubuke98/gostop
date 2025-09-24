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
          <table className="table-auto w-full text-left text-white min-w-max">
            <thead>
              <tr>
                <th className="px-2 sm:px-4 py-1 sm:py-2">Name</th>
                <th className="px-2 sm:px-4 py-1 sm:py-2">Games Played</th>
                <th className="px-2 sm:px-4 py-1 sm:py-2">Win %</th>
                <th className="px-2 sm:px-4 py-1 sm:py-2">Avg Points/Win</th>
                <th className="px-2 sm:px-4 py-1 sm:py-2">Avg Sell</th>
                <th className="px-2 sm:px-4 py-1 sm:py-2">Max Sell</th>
              </tr>
            </thead>
            <tbody>
              {stats.players.map(player => (
                <tr key={player.id} className="border-t border-gray-600">
                  <td className="px-2 sm:px-4 py-1 sm:py-2">{player.name}</td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2">{player.games_played}</td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2">{player.win_percentage}%</td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2">{player.avg_points_per_win}</td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2">{player.avg_sell}</td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2">{player.max_sell}</td>
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

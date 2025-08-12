import React, { useState, useEffect } from "react";
import { sendREST } from "../utils/api.js";

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

      // Fetch SVG as raw text
      const svgResponse = await sendREST("/player.svg");
      console.log(svgResponse);
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
      <div className="flex flex-col p-6 gap-6">

        {/* Dealer Win Percentage */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-white mb-2">
            Dealer Win Percentage:
          </h2>
          <p className="text-white text-xl">{stats.dealer_win_percentage}%</p>
        </div>

        {/* Players and Game Count */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-white mb-4">Player Stats</h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left text-white">
              <thead>
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Games Played</th>
                  <th className="px-4 py-2">Win Percentage</th>
                  <th className="px-4 py-2">Average Points per Win</th>
                </tr>
              </thead>
              <tbody>
                {stats.players.map((player) => (
                  <tr key={player.id} className="border-t border-gray-600">
                    <td className="px-4 py-2">{player.name}</td>
                    <td className="px-4 py-2">{player.games_played}</td>
                    <td className="px-4 py-2">{player.win_percentage}%</td>
                    <td className="px-4 py-2">{player.avg_points_per_win}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Player Points Over Time SVG */}
        {svgMarkup && (
          <div
            className="bg-white p-4 rounded-lg shadow-md overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        )}
      </div>
    </div>
  );
}

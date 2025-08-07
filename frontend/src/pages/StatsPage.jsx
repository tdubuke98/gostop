import React, { useState, useEffect } from "react";
import { sendREST } from "../utils/api.js";

export default function StatsPage() {
  const [stats, setStats] = useState([]);

  async function fetchAllStats() {
    try {
      const data = await sendREST("/stats");
      setStats(data);
    } catch (error) {
      console.error("Fetching stats failed:", error);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  return (
    <div className="bg-gray-300">
      <div className="flex flex-row h-[calc(100vh-68px)] gap-6 p-6">
        <div className="flex bg-gray-800 rounded-lg gap-6">
          <h2 className="text-2xl font-bold text-white">
            Dealer/Winner: {stats.dealer_win_percentage}%
          </h2>
        </div>
      </div>
    </div>
  );
}

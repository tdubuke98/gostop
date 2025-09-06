import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart3, LogIn } from "lucide-react";
import { useGames } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";

const navItems = [
  { label: "Stats", icon: BarChart3, path: "/stats"},
  { label: "Home", icon: Home, path: "/" },
  { label: "Login", icon: LogIn, path: "/login"}
];

export default function Navbar() {
  const { reloadBalances } = useGames();
  const { muted, setMuted } = useSettings();

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="flex flex-row bg-gray-800 justify-between items-center p-4 shadow-lg">
      <h1
        onClick={() => reloadBalances()}
        className="flex text-2xl font-bold text-white">
        🎴 Go-Stop
      </h1>

      <div className="flex bg-gray-800 gap-2 shadow-lg">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition bg-blue-700 text-white`}
          onClick={()=>{setMuted(!muted)}}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                ${
                    isActive
                    ? "bg-blue-700 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-700"
                }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart3, LogIn } from "lucide-react";
import { useGames } from "../context/GameContext";

const navItems = [
  { label: "Stats", icon: BarChart3, path: "/stats" },
  { label: "Home", icon: Home, path: "/" },
  { label: "Login", icon: LogIn, path: "/login" },
];

export default function Navbar() {
  const { reloadBalances } = useGames();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex flex-row bg-gray-800 justify-between items-center p-4 shadow-lg">
        <h1
          onClick={() => reloadBalances()}
          className="flex text-2xl font-bold text-white cursor-pointer"
        >
          🎴 Go-Stop
        </h1>

        <div className="flex bg-gray-800 gap-2 shadow-lg">
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
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-800 shadow-lg border-t border-gray-700">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ label, icon: Icon, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 px-2 py-1 text-xs font-medium transition
                  ${
                    isActive
                      ? "text-blue-400"
                      : "text-gray-400 hover:text-white"
                  }`}
              >
                <Icon className="w-6 h-6" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

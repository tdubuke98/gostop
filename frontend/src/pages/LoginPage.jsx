import React, { useState } from "react";
import { sendREST } from "../utils/api.js";
import { LogIn, LogOut } from "lucide-react";

export default function LoginPage({ setIsAuth, isAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await sendREST("/login", { username, password }, "POST");
      localStorage.setItem("token", result.access_token);
      setIsAuth(true);
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
  };

  if (isAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-300 p-4">
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 sm:p-8 w-full max-w-md text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white">
            You are logged in
          </h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded flex justify-center items-center gap-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-300 p-4">
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white text-center">
          Login
        </h2>

        {error && (
          <div className="mb-4 text-red-400 text-center text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-300 text-sm sm:text-base">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 sm:py-3 border rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm sm:text-base">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 sm:py-3 border rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded flex justify-center items-center gap-2 transition-colors text-sm sm:text-base"
          >
            <LogIn className="w-5 h-5" />
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

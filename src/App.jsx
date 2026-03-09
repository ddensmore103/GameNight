/**
 * App Component
 *
 * Defines the application routes and renders the animated background.
 * Also runs the reconnect hook to auto-rejoin rooms after refresh.
 */

import { Routes, Route } from "react-router-dom";
import { useReconnect } from "./hooks/useReconnect";
import Home from "./pages/Home";
import CreateParty from "./pages/CreateParty";
import JoinParty from "./pages/JoinParty";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";

export default function App() {
  // Attempt to reconnect to a saved room on app startup
  const { reconnecting } = useReconnect();

  // Show loading screen while checking for a saved session
  if (reconnecting) {
    return (
      <>
        <div className="app-background" />
        <div className="loading-screen">
          <div className="spinner" />
          <p className="text-muted">Reconnecting…</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Animated gradient background — always visible behind all pages */}
      <div className="app-background" />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateParty />} />
        <Route path="/join" element={<JoinParty />} />
        <Route path="/lobby/:roomCode" element={<LobbyPage />} />
        <Route path="/game/:roomCode" element={<GamePage />} />
      </Routes>
    </>
  );
}

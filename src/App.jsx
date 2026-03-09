/**
 * App Component
 *
 * Defines the application routes and renders the animated background.
 */

import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateParty from "./pages/CreateParty";
import JoinParty from "./pages/JoinParty";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";

export default function App() {
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

/**
 * Lobby Page
 *
 * Shows the room code, player list, and a "Start Game" button for the host.
 * All data is live — powered by the useRoom hook.
 * When the host starts the game, all clients redirect to /game/:roomCode.
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { startGame, clearSession } from "../firebase/databaseHelpers";
import PlayerList from "../components/PlayerList";

export default function LobbyPage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { room, players, hostId, status, loading, error } = useRoom(roomCode);

    const isHost = user?.uid === hostId;
    const playerCount = players ? Object.keys(players).length : 0;

    // When status changes to "playing", navigate to the game page
    useEffect(() => {
        if (status === "playing") {
            navigate(`/game/${roomCode}`, { replace: true });
        }
    }, [status, roomCode, navigate]);

    async function handleStartGame() {
        if (!isHost) return;
        try {
            await startGame(roomCode);
        } catch (err) {
            console.error("Failed to start game:", err);
        }
    }

    // ─── Loading / Error states ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p className="text-muted">Connecting to room…</p>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="page">
                <div className="page-content fade-in-up">
                    <h1 className="logo logo-sm">GameNight</h1>
                    <div className="glass-card text-center">
                        <p className="error-message">
                            {error || "Room not found."}
                        </p>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate("/")}>
                        ← Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-content fade-in-up">
                <h1 className="logo logo-sm">GameNight</h1>

                {/* Room Code */}
                <div className="room-code-display">
                    <span className="label">Room Code</span>
                    <span className="room-code" title="Click to copy" onClick={() => {
                        navigator.clipboard.writeText(roomCode);
                    }}>
                        {roomCode}
                    </span>
                    <span className="room-code-hint">Share this code with your friends</span>
                </div>

                {/* Player List */}
                <div className="glass-card">
                    <div className="flex-row justify-between items-center" style={{ marginBottom: "1rem" }}>
                        <h3>Players</h3>
                        <div className="status-bar">
                            <span className="status-dot" />
                            <span>{playerCount} connected</span>
                        </div>
                    </div>

                    <PlayerList players={players} hostId={hostId} />
                </div>

                {/* Actions */}
                {isHost ? (
                    <button
                        id="start-game-btn"
                        className="btn btn-primary btn-block"
                        onClick={handleStartGame}
                        disabled={playerCount < 2}
                    >
                        {playerCount < 2 ? "Waiting for players…" : "🚀 Start Game"}
                    </button>
                ) : (
                    <p className="waiting-text">Waiting for host to start the game…</p>
                )}

                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                        clearSession();
                        navigate("/");
                    }}
                >
                    Leave Room
                </button>
            </div>
        </div>
    );
}

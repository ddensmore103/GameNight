/**
 * Game Page
 *
 * Hosts the active game. Uses useRoom to get live game state
 * and renders the appropriate game component.
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import GameContainer from "../components/GameContainer";

export default function GamePage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { room, players, gameState, hostId, status, loading, error } = useRoom(roomCode);

    const isHost = user?.uid === hostId;

    // If room goes back to lobby (play again), redirect
    useEffect(() => {
        if (status === "lobby") {
            navigate(`/lobby/${roomCode}`, { replace: true });
        }
    }, [status, roomCode, navigate]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p className="text-muted">Loading game…</p>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="page">
                <div className="page-content fade-in-up">
                    <h1 className="logo logo-sm">GameNight</h1>
                    <div className="glass-card text-center">
                        <p className="error-message">{error || "Room not found."}</p>
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
            <div className="page-content fade-in-up" style={{ maxWidth: "560px" }}>
                <div className="flex-row justify-between items-center w-full">
                    <h1 className="logo logo-sm">GameNight</h1>
                    <div className="status-bar">
                        <span className="label">{roomCode}</span>
                    </div>
                </div>

                <GameContainer
                    roomCode={roomCode}
                    players={players}
                    gameState={gameState}
                    isHost={isHost}
                    currentUserId={user?.uid}
                />
            </div>
        </div>
    );
}

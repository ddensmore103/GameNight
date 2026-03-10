/**
 * Game Page
 *
 * Hosts the active game. Uses useRoom to get live game state
 * and renders the appropriate game component based on gameState.currentGame.
 *
 * Flow:
 *   status === "playing" + gameState === null → GameSelection screen
 *   gameState.currentGame === "mostLikelyTo"  → MostLikelyTo (GameContainer)
 *   gameState.currentGame === "truthOrDare"   → TruthOrDareGame
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import GameSelection from "../components/GameSelection";
import GameContainer from "../components/GameContainer";
import TruthOrDareGame from "../games/TruthOrDareGame";
import GuessTheEmojiGame from "../games/GuessTheEmojiGame";
import { leaveRoom, joinRoom, loadSession } from "../firebase/databaseHelpers";

export default function GamePage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { room, players, gameState, hostId, status, loading, error } = useRoom(roomCode);

    const isHost = user?.uid === hostId;
    const currentGame = gameState?.currentGame || null;

    // Rejoin room logic (handles refresh directly on the game page)
    useEffect(() => {
        if (!user || !roomCode) return;

        async function ensureJoined() {
            try {
                const session = loadSession();
                const sessionName = session?.playerName || "Player";
                await joinRoom(roomCode, user.uid, sessionName);
            } catch (err) {
                console.error("Failed to rejoin on game refresh:", err);
                // navigate("/") is omitted here to prevent kicking players out
                // if they are just quickly refreshing and the room is still valid.
            }
        }

        ensureJoined();
    }, [user, roomCode]);

    // If room goes back to lobby (host pressed "Back to Lobby"), redirect
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

    // ─── Determine which screen to show ─────────────────────────────────────
    function renderGame() {
        // No game selected yet → show game selection screen
        if (!currentGame) {
            return (
                <GameSelection
                    roomCode={roomCode}
                    players={players}
                    isHost={isHost}
                />
            );
        }

        // Route to the correct game component based on currentGame
        switch (currentGame) {
            case "mostLikelyTo":
                return (
                    <GameContainer
                        roomCode={roomCode}
                        players={players}
                        gameState={gameState}
                        isHost={isHost}
                        currentUserId={user?.uid}
                    />
                );

            case "truthOrDare":
                return (
                    <TruthOrDareGame
                        roomCode={roomCode}
                        players={players}
                        gameState={gameState}
                        isHost={isHost}
                        currentUserId={user?.uid}
                    />
                );

            case "guessTheEmoji":
                return (
                    <GuessTheEmojiGame
                        roomCode={roomCode}
                        players={players}
                        gameState={gameState}
                        isHost={isHost}
                        currentUserId={user?.uid}
                    />
                );

            default:
                return (
                    <div className="glass-card text-center">
                        <p className="text-muted">Unknown game: {currentGame}</p>
                    </div>
                );
        }
    }

    return (
        <div className="page">
            <div className="page-content fade-in-up" style={{ maxWidth: "560px" }}>
                <div className="flex-row justify-between items-center w-full" style={{ marginBottom: "1rem" }}>
                    <h1 className="logo logo-sm" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>GameNight</h1>
                    <div className="flex-row gap-sm items-center">
                        <div className="status-bar">
                            <span className="label">{roomCode}</span>
                        </div>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={async () => {
                                if (window.confirm("Are you sure you want to leave the party?")) {
                                    await leaveRoom(roomCode, user?.uid);
                                    navigate("/");
                                }
                            }}
                        >
                            Leave
                        </button>
                    </div>
                </div>

                {renderGame()}
            </div>
        </div>
    );
}

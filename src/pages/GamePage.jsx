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
        // No game selected yet (Selection Screen) → Everyone can see this
        if (!currentGame) {
            return (
                <GameSelection
                    roomCode={roomCode}
                    players={players}
                    isHost={isHost}
                    gameVotes={room?.gameVotes}
                    currentUserId={user?.uid}
                />
            );
        }

        // If a game is active, check if the player was in the room when it started
        // (Reconnecting players are always in the active list)
        const activeIds = gameState?.activePlayerIds || [];
        const isLateJoiner = user && !activeIds.includes(user.uid);

        if (isLateJoiner) {
            return (
                <div className="glass-card text-center fade-in-up">
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
                    <h2 style={{ marginBottom: "0.5rem" }}>Game in Progress</h2>
                    <p className="text-muted">
                        A round of <strong>{currentGame === "mostLikelyTo" ? "Most Likely To" : currentGame === "truthOrDare" ? "Truth or Dare" : "Guess The Emoji"}</strong> is currently active.
                    </p>
                    <p className="waiting-text" style={{ marginTop: "1rem" }}>
                        You'll be able to join as soon as this game ends and the host returns to selection!
                    </p>
                </div>
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
            {/* Top-aligned Header */}
            <div className="page-header">
                <h1 className="logo logo-sm" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>GameNight</h1>

                <div className="flex-row gap-sm items-center">
                    <div className="status-bar" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <span className="text-muted" style={{ fontWeight: 700, letterSpacing: "1px" }}>{roomCode}</span>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.5rem 1rem" }}
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to leave the game?")) {
                                await leaveRoom(roomCode, user?.uid);
                                navigate("/");
                            }
                        }}
                    >
                        Leave
                    </button>
                </div>
            </div>

            {/* Centered Main Content */}
            <div className="page-content fade-in-up" style={{ margin: "auto 0" }}>
                {renderGame()}
            </div>
        </div>
    );
}

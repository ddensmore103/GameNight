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
import PlayerList from "../components/PlayerList";
import GameSelection from "../components/GameSelection";
import GameContainer from "../components/GameContainer";
import TruthOrDareGame from "../games/TruthOrDareGame";
import GuessTheEmojiGame from "../games/GuessTheEmojiGame";
import ImposterGame from "../games/ImposterGame";
import { leaveRoom, joinRoom, loadSession, transferHost } from "../firebase/databaseHelpers";

export default function GamePage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { room, players, gameState, hostId, status, loading, error } = useRoom(roomCode);

    const isHost = user?.uid === hostId;
    const currentGame = gameState?.currentGame || null;

    // Handler: transfer host
    async function handleTransferHost(newHostId) {
        try {
            await transferHost(roomCode, newHostId);
        } catch (err) {
            console.error("Failed to transfer host:", err);
        }
    }

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
        // Selection Screen logic is handled by the main layout now
        if (!currentGame) return null;

        // If a game is active, check if the player was in the room when it started
        const activeIds = gameState?.activePlayerIds || [];
        const isLateJoiner = user && !activeIds.includes(user.uid);

        if (isLateJoiner) {
            return (
                <div className="glass-card text-center fade-in-up">
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
                    <h2 style={{ marginBottom: "0.5rem" }}>Game in Progress</h2>
                    <p className="text-muted">
                        A round of <strong>{
                            currentGame === "mostLikelyTo" ? "Who's Most Likely To" :
                                currentGame === "truthOrDare" ? "Truth or Dare" :
                                    currentGame === "guessTheEmoji" ? "Guess The Emoji" :
                                        "Imposter"
                        }</strong> is currently active.
                    </p>
                    <p className="waiting-text" style={{ marginTop: "1rem" }}>
                        You'll be able to join as soon as this game ends and the host returns to selection!
                    </p>
                </div>
            );
        }

        // Route to the correct game component
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
            case "imposter":
                return (
                    <ImposterGame
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
            <div className="page-header">
                <div>
                    <h1 className="logo logo-sm" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>GameNight</h1>
                </div>

                <div className="room-code-box">
                    <span className="room-code" style={{ letterSpacing: "0.2em" }}>{roomCode}</span>
                </div>

                <div style={{ justifySelf: "end" }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                            await leaveRoom(roomCode, user?.uid);
                            navigate("/");
                        }}
                    >
                        Leave
                    </button>
                </div>
            </div>

            <div className="page-content wide" style={{ maxWidth: "100%", margin: "0", justifyContent: "flex-start" }}>
                {!currentGame ? (
                    <div className="lobby-layout">
                        {/* Sidebar: Players (Desktop: Left, Mobile: Bottom) */}
                        <aside className="lobby-sidebar">
                            <div className="glass-card glass-card-sm sidebar-section">
                                <span className="label">Players ({players ? Object.keys(players).length : 0})</span>
                                <PlayerList
                                    players={players}
                                    hostId={hostId}
                                    currentUserId={user?.uid}
                                    onTransferHost={handleTransferHost}
                                />
                            </div>
                        </aside>

                        {/* Main: Game Selection (Centered) */}
                        <main className="lobby-main">
                            <GameSelection
                                roomCode={roomCode}
                                players={players}
                                isHost={isHost}
                                gameVotes={room?.gameVotes}
                                currentUserId={user?.uid}
                            />
                        </main>

                        {/* Right Spacer for Grid centering on desktop */}
                        <div className="desktop-only" style={{ width: "320px" }}></div>
                    </div>
                ) : (
                    <div className="fade-in-up w-full" style={{ maxWidth: "var(--max-width)", margin: "0 auto" }}>
                        {renderGame()}
                    </div>
                )}
            </div>
        </div>
    );
}

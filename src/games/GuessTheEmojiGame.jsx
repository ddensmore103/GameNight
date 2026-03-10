/**
 * Guess The Emoji Game Component
 *
 * Flow:
 *   1. Phase "guessing": players see an emoji puzzle and type guesses into an input.
 *   2. The first correct guess triggers phase "round_end", awarding a point and declaring the round winner.
 *   3. Host presses "Next Round", bringing up the next puzzle.
 *   4. Phase "finished": shows the game over results, same logic as other games.
 */

import { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    submitEmojiGuess,
    nextEmojiRound,
    returnToGameSelection,
} from "../firebase/databaseHelpers";
import PlayerList from "../components/PlayerList";
import GuessFeed from "../components/GuessFeed";
import { useNavigate } from "react-router-dom";

export default function GuessTheEmojiGame({
    roomCode,
    players,
    gameState,
    isHost,
    currentUserId,
}) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [guessInput, setGuessInput] = useState("");
    const [guessStatus, setGuessStatus] = useState("idle");

    const phase = gameState?.phase || "guessing";
    const round = gameState?.round || 1;
    const totalRounds = gameState?.totalRounds || 5;
    const puzzle = gameState?.puzzle || "";
    const answer = gameState?.answer || "";
    const theme = gameState?.theme || "Puzzle";
    const correctGuesses = gameState?.correctGuesses || {};
    const lives = gameState?.lives || {};

    const myLives = lives[currentUserId] !== undefined ? lives[currentUserId] : 3;
    const myPointsEarnedThisRound = correctGuesses[currentUserId];

    const playerEntries = useMemo(
        () => Object.entries(players || {}),
        [players]
    );

    // ─── Final Scores Logic ───────────────────────────────────────────────────
    const finalScores = useMemo(() => {
        return playerEntries
            .map(([id, player]) => ({
                id,
                name: player.name,
                score: player.score || 0,
            }))
            .sort((a, b) => b.score - a.score);
    }, [playerEntries]);

    // ─── Handle Guess Submission ──────────────────────────────────────────────
    async function handleGuessSubmit(e) {
        e.preventDefault();
        if (!guessInput.trim() || phase !== "guessing" || myLives <= 0) return;

        const currentGuess = guessInput;
        setGuessInput(""); // Clear input quickly

        try {
            const isCorrect = await submitEmojiGuess(roomCode, currentUserId, currentGuess);
            if (!isCorrect) {
                // We set a temporary "wrong" status that fades
                setGuessStatus("wrong");
                setTimeout(() => setGuessStatus("idle"), 2000);
            }
        } catch (err) {
            console.error("Failed to submit guess:", err);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: Finished Phase — Final Scoreboard
    // ═══════════════════════════════════════════════════════════════════════════
    if (phase === "finished") {
        const rankEmoji = ["🥇", "🥈", "🥉"];

        return (
            <div className="glass-card fade-in-up">
                <h2 className="text-center" style={{ marginBottom: "0.5rem" }}>
                    🏆 Game Over!
                </h2>
                <p className="text-center text-muted" style={{ marginBottom: "1.5rem" }}>
                    Final Standings
                </p>

                <div className="podium stagger">
                    {finalScores.map((player, i) => (
                        <div key={player.id} className="podium-item">
                            <span className="podium-rank">
                                {rankEmoji[i] || `${i + 1}.`}
                            </span>
                            <span className="result-name">{player.name}</span>
                            <span className="player-score">{player.score} pts</span>
                        </div>
                    ))}
                </div>

                {isHost && (
                    <div className="flex-col gap-md mt-lg">
                        <button
                            className="btn btn-primary btn-block"
                            onClick={() => returnToGameSelection(roomCode)}
                        >
                            🎮 Pick Another Game
                        </button>
                    </div>
                )}

                {!isHost && (
                    <p className="waiting-text mt-lg">
                        Waiting for host to start a new game…
                    </p>
                )}

                {/* Show save stats CTA if guest */}
                {user?.isAnonymous && (
                    <div className="mt-lg flex-col items-center">
                        <button
                            className="btn btn-secondary btn-block"
                            style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)" }}
                            onClick={() => navigate("/signup")}
                        >
                            💾 Save Your Stats: Create Profile
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: Round End Phase — Show Winner & Answer
    // ═══════════════════════════════════════════════════════════════════════════
    if (phase === "round_end") {
        const correctGuessers = Object.entries(correctGuesses).sort((a, b) => b[1] - a[1]); // Sort by points desc
        const someoneGotIt = correctGuessers.length > 0;

        return (
            <div className="flex-col gap-lg w-full fade-in-up">
                <div className="flex-row justify-center">
                    <span className="round-indicator">Round {round} of {totalRounds}</span>
                </div>

                <div className="glass-card prompt-card" style={{
                    borderColor: someoneGotIt ? "var(--accent-success)" : "var(--accent-danger)",
                    position: "relative"
                }}>
                    <span style={{
                        position: "absolute", top: "1rem", left: "1rem",
                        background: "rgba(255,255,255,0.1)", padding: "0.25rem 0.5rem",
                        borderRadius: "var(--radius-sm)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px"
                    }}>{theme}</span>
                    <p className="emoji-puzzle-large">{puzzle}</p>

                    <div className="mt-md fade-in">
                        <p className="text-muted" style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>The answer was</p>
                        <p className="emoji-answer-reveal">{answer}</p>
                    </div>
                </div>

                <div className="glass-card text-center fade-in">
                    {someoneGotIt ? (
                        <>
                            <h2 style={{ color: "var(--accent-success)", marginBottom: "1rem" }}>
                                🎉 Winners this round!
                            </h2>
                            <div className="flex-col gap-sm">
                                {correctGuessers.map(([uid, pointsEarned]) => (
                                    <div key={uid} className="flex-row justify-between items-center" style={{
                                        padding: "0.5rem 1rem", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)"
                                    }}>
                                        <span style={{ fontWeight: "bold" }}>{players?.[uid]?.name || "Someone"}</span>
                                        <span style={{ color: "var(--accent-success)" }}>+{pointsEarned} {pointsEarned === 1 ? "Point" : "Points"}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 style={{ color: "var(--accent-danger)", marginBottom: "0.5rem" }}>
                                💀 No one got it!
                            </h2>
                            <p className="text-muted">Everyone ran out of lives</p>
                        </>
                    )}
                </div>

                {/* Scoreboard Preview */}
                <div className="glass-card" style={{ padding: "1rem" }}>
                    <div className="flex-row justify-between items-center" style={{ marginBottom: "0.5rem" }}>
                        <h4 style={{ margin: 0 }}>Scores</h4>
                    </div>
                    <PlayerList players={players} hostId={null} compact={true} />
                </div>

                <GuessFeed roomCode={roomCode} phase={phase} />

                {isHost && (
                    <button
                        className="btn btn-primary btn-block mt-md"
                        onClick={() => nextEmojiRound(roomCode)}
                    >
                        {round >= totalRounds ? "See Final Scores" : "Next Round →"}
                    </button>
                )}

                {!isHost && (
                    <p className="waiting-text mt-md">Waiting for host…</p>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: Guessing Phase
    // ═══════════════════════════════════════════════════════════════════════════

    // Generate hearts display (e.g. ❤️❤️❤️, ❤️❤️🤍, ❤️🤍🤍, 🤍🤍🤍)
    const renderHearts = () => {
        const hearts = [];
        for (let i = 0; i < 3; i++) {
            hearts.push(
                <span key={i} style={{
                    fontSize: "1.2rem",
                    transition: "all 0.3s ease"
                }}>
                    {i < myLives ? "❤️" : "🤍"}
                </span>
            );
        }
        return hearts;
    };

    return (
        <div className="flex-col gap-lg w-full fade-in-up">
            <div className="flex-row justify-center">
                <span className="round-indicator">Round {round} of {totalRounds}</span>
            </div>

            {/* Puzzle Display */}
            <div className="glass-card prompt-card" style={{ padding: "3rem 1rem", position: "relative" }}>
                <span style={{
                    position: "absolute", top: "1rem", left: "1rem",
                    background: "rgba(255,255,255,0.1)", padding: "0.25rem 0.5rem",
                    borderRadius: "var(--radius-sm)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px"
                }}>{theme}</span>
                <p className="emoji-puzzle-large">{puzzle}</p>
            </div>

            {/* Guess Input Area */}
            <div className="glass-card fade-in">
                <div className="flex-row justify-between items-center" style={{ marginBottom: "1rem" }}>
                    <h3 style={{ margin: 0 }}>What does this mean?</h3>
                    <div className="flex-row gap-xs">
                        {renderHearts()}
                    </div>
                </div>

                {myLives > 0 ? (
                    <form onSubmit={handleGuessSubmit} className="flex-col gap-md">
                        <div className="input-group flex-col gap-sm">
                            <input
                                type="text"
                                className={`input ${guessStatus === "wrong" ? "input-shake" : ""}`}
                                placeholder={myPointsEarnedThisRound ? "You got it! Waiting for others..." : "Type your guess here..."}
                                value={guessInput}
                                onChange={(e) => {
                                    setGuessInput(e.target.value);
                                    if (guessStatus !== "idle") setGuessStatus("idle");
                                }}
                                autoFocus
                                autoComplete="off"
                                spellCheck="false"
                                disabled={!!myPointsEarnedThisRound}
                            />
                            {guessStatus === "wrong" && (
                                <p className="text-center" style={{ color: "var(--accent-danger)", fontSize: "0.85rem" }}>
                                    Incorrect guess, you lost a life!
                                </p>
                            )}
                        </div>

                        {myPointsEarnedThisRound ? (
                            <div className="text-center p-sm" style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-success)" }}>
                                <p style={{ color: "var(--accent-success)", fontWeight: "bold" }}>
                                    🎉 Correct! (+{myPointsEarnedThisRound} {myPointsEarnedThisRound === 1 ? "Point" : "Points"})
                                </p>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={!guessInput.trim()}
                            >
                                Submit Guess
                            </button>
                        )}
                    </form>
                ) : (
                    <div className="text-center p-md" style={{ border: "1px dashed var(--accent-danger)", borderRadius: "var(--radius-md)", background: "rgba(248, 113, 113, 0.05)" }}>
                        <p style={{ color: "var(--accent-danger)", fontWeight: "bold", fontSize: "1.1rem" }}>💀 Out of lives!</p>
                        <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Wait for others to finish guessing.</p>
                    </div>
                )}
            </div>

            {/* Scoreboard Preview & Live Feed Container */}
            <div className="flex-responsive">
                <div className="glass-card" style={{ padding: "1rem", flex: "1" }}>
                    <div className="flex-row justify-between items-center" style={{ marginBottom: "0.5rem" }}>
                        <h4 style={{ margin: 0 }}>Scores</h4>
                    </div>
                    <PlayerList players={players} hostId={null} compact={true} />
                </div>

                <GuessFeed roomCode={roomCode} phase={phase} />
            </div>
        </div>
    );
}

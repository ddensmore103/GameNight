import { useState, useEffect } from "react";
import {
    setImposterMode,
    confirmImposterRole,
    submitImposterHint,
    submitImposterVote,
    revealImposterResults,
    imposterGuessWord,
    returnToGameSelection,
} from "../firebase/databaseHelpers";

export default function ImposterGame({ roomCode, players, gameState, isHost, currentUserId }) {
    const [hintInput, setHintInput] = useState("");
    const [imposterGuess, setImposterGuess] = useState("");
    const [hasVoted, setHasVoted] = useState(false);

    const {
        phase,
        imposterId,
        secretWord,
        hints = {},
        votes = {},
        turnOrder = [],
        currentTurn = 0,
        confirmedRoles = {},
        activePlayerIds = [],
        winner,
        caught,
        playMode,
    } = gameState;

    const isImposter = currentUserId === imposterId;
    const currentPlayerId = turnOrder[currentTurn];
    const isMyTurn = currentUserId === currentPlayerId;
    const hasConfirmedRole = confirmedRoles[currentUserId];

    // Reset local vote state when phase changes
    useEffect(() => {
        if (phase !== "voting") {
            setHasVoted(false);
        }
    }, [phase]);

    // ─── Phase: Setup Mode (Host Only) ────────────────────────────────────
    if (phase === "setup_mode") {
        if (!isHost) {
            return (
                <div className="glass-card text-center fade-in-up">
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎮</div>
                    <h2>Waiting for Host</h2>
                    <p className="text-muted">The host is choosing how to play...</p>
                </div>
            );
        }

        return (
            <div className="glass-card text-center fade-in-up">
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🕵️‍♂️</div>
                <h2>Imposter</h2>
                <p className="text-muted mb-lg">How would you like to play this round?</p>
                <div className="flex-col gap-md">
                    <button
                        className="btn btn-primary btn-block"
                        onClick={() => setImposterMode(roomCode, "online")}
                    >
                        🌐 Play Online (Typed)
                    </button>
                    <button
                        className="btn btn-secondary btn-block"
                        onClick={() => setImposterMode(roomCode, "in_person")}
                    >
                        👥 Play In-Person (Verbal)
                    </button>
                    <p className="text-muted mt-md" style={{ fontSize: "0.85rem" }}>
                        <strong>In-Person:</strong> Hints and voting are done out loud. Use your phone only to see your role!
                    </p>
                </div>
            </div>
        );
    }

    // ─── Phase: Role Reveal ────────────────────────────────────────────────
    if (phase === "role_reveal") {
        return (
            <div className="glass-card text-center fade-in-up">
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🕵️‍♂️</div>
                <h2>Your Secret Role</h2>

                <div className="mt-lg mb-lg">
                    {isImposter ? (
                        <div className="scale-in">
                            <h1 style={{ color: "var(--accent-danger)", fontSize: "clamp(2rem, 8vw, 2.5rem)" }}>IMPOSTER</h1>
                            <p className="text-muted">You don't know the word. Try to blend in!</p>
                        </div>
                    ) : (
                        <div className="scale-in">
                            <p className="label">The Secret Word is</p>
                            <h1 style={{
                                color: "var(--accent-secondary)",
                                fontSize: "clamp(2rem, 10vw, 3rem)",
                                textTransform: "uppercase",
                                wordBreak: "break-word"
                            }}>
                                {secretWord}
                            </h1>
                            <p className="text-muted">Give hints without being too obvious.</p>
                        </div>
                    )}
                </div>

                {hasConfirmedRole ? (
                    <p className="waiting-text">Waiting for others...</p>
                ) : (
                    <button
                        className="btn btn-primary btn-block"
                        onClick={() => confirmImposterRole(roomCode, currentUserId)}
                    >
                        I'm Ready
                    </button>
                )}
            </div>
        );
    }

    // ─── Phase: Gameplay (In-Person or Hints) ───────────────────────────────
    if (phase === "hints" && playMode === "in_person") {
        return (
            <div className="glass-card text-center fade-in-up">
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🗣️</div>
                <h2>Take Turns Giving Hints!</h2>
                <p className="text-muted mb-lg">
                    Go around the room and give one-word hints about the secret word.
                </p>

                <div className="mt-lg mb-lg p-md" style={{ background: "var(--glass-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                    {isImposter ? (
                        <h1 style={{ color: "var(--accent-danger)", fontSize: "2rem" }}>IMPOSTER</h1>
                    ) : (
                        <>
                            <p className="label">The Secret Word is</p>
                            <h1 style={{ color: "var(--accent-secondary)", fontSize: "2.5rem", textTransform: "uppercase" }}>{secretWord}</h1>
                        </>
                    )}
                </div>

                <p className="text-muted mb-xl">
                    Once everyone has given a hint and you've discussed who the imposter might be...
                </p>

                {isHost && (
                    <button className="btn btn-primary btn-block" onClick={() => revealImposterResults(roomCode)}>
                        Reveal Results
                    </button>
                )}
                {!isHost && <p className="waiting-text">Waiting for host to reveal results...</p>}
            </div>
        );
    }

    // ─── Phase: Hints (Online) ──────────────────────────────────────────────
    if (phase === "hints") {
        return (
            <div className="flex-col gap-lg w-full fade-in-up">
                <div className="glass-card text-center">
                    <div className="round-indicator mb-sm">
                        <span>Round Phase: Hints</span>
                    </div>
                    {isMyTurn ? (
                        <>
                            <h2>Your Turn!</h2>
                            <p className="text-muted mb-md">
                                {isImposter ? "Give a vague hint to blend in." : `Give a hint for: ${secretWord}`}
                            </p>
                            <div className="flex-row gap-sm">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="One word only..."
                                    value={hintInput}
                                    onChange={(e) => setHintInput(e.target.value.split(" ")[0])}
                                    onKeyDown={(e) => e.key === "Enter" && hintInput.trim() && submitImposterHint(roomCode, currentUserId, hintInput.trim())}
                                />
                                <button
                                    className="btn btn-primary"
                                    disabled={!hintInput.trim()}
                                    onClick={() => submitImposterHint(roomCode, currentUserId, hintInput.trim())}
                                >
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                            <h3>{players[currentPlayerId]?.name}'s Turn</h3>
                            <p className="text-muted">Waiting for their hint...</p>
                        </>
                    )}
                </div>

                <div className="glass-card">
                    <span className="label mb-md d-block">The Hints</span>
                    <div className="flex-col gap-sm mt-md">
                        {turnOrder.map((id) => (
                            <div key={id} className={`player-item ${hints[id] ? "fade-in" : "opacity-50"}`} style={{
                                opacity: hints[id] ? 1 : 0.5,
                                padding: "var(--space-sm) var(--space-md)"
                            }}>
                                <div className="player-avatar" style={{ background: "var(--glass-border)", width: "32px", height: "32px", fontSize: "0.8rem" }}>
                                    {players[id]?.name?.[0]}
                                </div>
                                <div className="player-info">
                                    <span className="player-name" style={{ fontSize: "0.9rem" }}>{players[id]?.name}</span>
                                </div>
                                {hints[id] ? (
                                    <span className="player-score" style={{ fontSize: "1rem" }}>{hints[id]}</span>
                                ) : (
                                    <span className="text-muted" style={{ fontSize: "0.75rem", fontStyle: "italic" }}>Thinking...</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Phase: Voting ──────────────────────────────────────────────────────
    if (phase === "voting") {
        const voteCount = Object.keys(votes).length;
        const allVoted = voteCount >= activePlayerIds.length;

        return (
            <div className="flex-col gap-lg w-full fade-in-up">
                <div className="text-center">
                    <h2>Who is the Imposter?</h2>
                    <p className="text-muted">Discuss the hints and cast your vote!</p>
                </div>

                <div className="vote-grid">
                    {activePlayerIds.map((id) => {
                        // Can't vote for yourself
                        if (id === currentUserId) return null;

                        const isVoted = votes[currentUserId] === id;
                        return (
                            <button
                                key={id}
                                className={`vote-btn ${isVoted ? "selected" : ""}`}
                                onClick={() => submitImposterVote(roomCode, currentUserId, id)}
                                disabled={allVoted && !isVoted}
                            >
                                <div className="player-avatar" style={{ width: "48px", height: "48px", fontSize: "1.2rem" }}>
                                    {players[id]?.name?.[0]}
                                </div>
                                <span className="player-name">{players[id]?.name}</span>
                                {isVoted && <div className="vote-badge">My Vote</div>}
                            </button>
                        );
                    })}
                </div>

                <div className="text-center mt-lg">
                    <p className="text-muted">
                        {voteCount} / {activePlayerIds.length} votes cast
                    </p>
                    {isHost && allVoted && (
                        <button className="btn btn-primary mt-md" onClick={() => revealImposterResults(roomCode)}>
                            Reveal Results
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ─── Phase: Results ─────────────────────────────────────────────────────
    if (phase === "results") {
        return (
            <div className="glass-card text-center fade-in-up">
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    {winner === "players" ? "🎉" : caught ? "⚖️" : "🤫"}
                </div>

                {winner && winner !== "none" ? (
                    <>
                        <h1 style={{ color: winner === "imposter" ? "var(--accent-danger)" : "var(--accent-success)", fontSize: "clamp(1.5rem, 8vw, 2.5rem)" }}>
                            {winner === "imposter" ? "IMPOSTER WINS!" : "PLAYERS WIN!"}
                        </h1>
                        <div className="mt-lg mb-xl">
                            <p className="text-muted">The Imposter was</p>
                            <h2 style={{ fontSize: "1.5rem" }}>{players[imposterId]?.name}</h2>
                            <p className="text-muted mt-md">Secret Word: <strong>{secretWord}</strong></p>
                        </div>
                        {isHost && (
                            <button className="btn btn-primary btn-block" onClick={() => returnToGameSelection(roomCode)}>
                                Back to Selection
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {winner === "none" ? (
                            <div className="mt-lg mb-xl">
                                <h1 style={{ color: "var(--accent-secondary)", fontSize: "clamp(1.5rem, 8vw, 2.5rem)" }}>REVEAL!</h1>
                                <p className="text-muted mt-md">The Imposter was</p>
                                <h2 style={{ fontSize: "2rem", color: "var(--accent-danger)" }}>{players[imposterId]?.name}</h2>
                                <p className="text-muted mt-lg">Secret Word: <strong>{secretWord}</strong></p>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ color: "var(--accent-warning)", fontSize: "1.5rem" }}>IMPOSTER CAUGHT!</h2>
                                <p className="text-muted mb-lg">
                                    {players[imposterId]?.name} was the imposter.
                                    <br />
                                    But they have one final chance to steal the win!
                                </p>
                            </>
                        )}

                        {winner === "none" ? (
                            isHost && (
                                <button className="btn btn-primary btn-block mt-lg" onClick={() => returnToGameSelection(roomCode)}>
                                    Back to Selection
                                </button>
                            )
                        ) : (
                            <>
                                {isImposter ? (
                                    <div className="flex-col gap-md">
                                        <p className="label">Guess the Secret Word</p>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Your guess..."
                                            value={imposterGuess}
                                            onChange={(e) => setImposterGuess(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && imposterGuess.trim() && imposterGuessWord(roomCode, imposterGuess.trim())}
                                        />
                                        <button
                                            className="btn btn-accent btn-block"
                                            disabled={!imposterGuess.trim()}
                                            onClick={() => imposterGuessWord(roomCode, imposterGuess.trim())}
                                        >
                                            Guess Word
                                        </button>
                                    </div>
                                ) : (
                                    <div className="waiting-text">
                                        Waiting for {players[imposterId]?.name} to guess the word...
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        );
    }

    return null;
}

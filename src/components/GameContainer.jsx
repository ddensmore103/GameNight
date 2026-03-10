/**
 * GameContainer Component — "Most Likely To"
 *
 * Renders the active game: prompt, vote buttons, results, and final scores.
 * All game state comes from Firebase via props (powered by useRoom in GamePage).
 *
 * Game phases:
 *   "voting"   → show prompt + vote buttons
 *   "results"  → show who got the most votes
 *   "finished" → show final scoreboard
 */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    submitVote,
    revealVotes,
    nextRound,
    returnToGameSelection,
} from "../firebase/databaseHelpers";
import PlayerList from "./PlayerList";
import { useNavigate } from "react-router-dom";

export default function GameContainer({
    roomCode,
    players,
    gameState,
    isHost,
    currentUserId,
}) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedVote, setSelectedVote] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const phase = gameState?.phase || "voting";
    const round = gameState?.round || 1;
    const totalRounds = gameState?.totalRounds || 5;
    const prompt = gameState?.prompt || "";
    const votes = gameState?.votes || {};

    const playerEntries = useMemo(
        () => Object.entries(players || {}),
        [players]
    );
    const playerCount = playerEntries.length;
    const voteCount = Object.keys(votes).length;
    const hasVoted = currentUserId in votes;

    // Reset selected vote when round changes
    useEffect(() => {
        setSelectedVote(null);
        setSubmitting(false);
    }, [round]);

    // Auto-reveal votes when everyone has voted (host only)
    useEffect(() => {
        if (isHost && phase === "voting" && voteCount >= playerCount && playerCount > 0) {
            revealVotes(roomCode).catch(console.error);
        }
    }, [isHost, phase, voteCount, playerCount, roomCode]);

    // ─── Handle Vote ────────────────────────────────────────────────────────
    async function handleVote(votedForId) {
        if (hasVoted || submitting) return;
        setSelectedVote(votedForId);
        setSubmitting(true);
        try {
            await submitVote(roomCode, currentUserId, votedForId);
        } catch (err) {
            console.error("Vote failed:", err);
            setSelectedVote(null);
        }
        setSubmitting(false);
    }

    // ─── Compute Results ───────────────────────────────────────────────────
    const voteResults = useMemo(() => {
        const counts = {};
        Object.values(votes).forEach((votedFor) => {
            counts[votedFor] = (counts[votedFor] || 0) + 1;
        });

        return playerEntries
            .map(([id, player]) => ({
                id,
                name: player.name,
                votes: counts[id] || 0,
            }))
            .sort((a, b) => b.votes - a.votes);
    }, [votes, playerEntries]);

    const maxVotes = voteResults.length > 0 ? voteResults[0].votes : 0;

    // ─── Final Scores ──────────────────────────────────────────────────────
    const finalScores = useMemo(() => {
        return playerEntries
            .map(([id, player]) => ({
                id,
                name: player.name,
                score: player.score || 0,
            }))
            .sort((a, b) => b.score - a.score);
    }, [playerEntries]);

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER: Finished Phase — Final Scoreboard
    // ═══════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER: Results Phase — Vote Reveal
    // ═══════════════════════════════════════════════════════════════════════
    if (phase === "results") {
        return (
            <div className="glass-card fade-in-up">
                <div className="flex-row justify-between items-center" style={{ marginBottom: "1rem" }}>
                    <h3>Results</h3>
                    <span className="round-indicator">
                        Round {round} of {totalRounds}
                    </span>
                </div>

                <p className="text-muted text-center" style={{ marginBottom: "1rem", fontStyle: "italic" }}>
                    "{prompt}"
                </p>

                <div className="results-list stagger">
                    {voteResults.map((r) => (
                        <div
                            key={r.id}
                            className={`result-item ${r.votes === maxVotes && r.votes > 0 ? "result-winner" : ""}`}
                        >
                            <span className="result-votes">{r.votes}</span>
                            <span className="result-name">
                                {r.name}
                                {r.votes === maxVotes && r.votes > 0 && " 🎉"}
                            </span>
                        </div>
                    ))}
                </div>

                {isHost && (
                    <button
                        className="btn btn-primary btn-block mt-lg"
                        onClick={() => nextRound(roomCode)}
                    >
                        {round >= totalRounds ? "See Final Scores" : "Next Round →"}
                    </button>
                )}

                {!isHost && (
                    <p className="waiting-text mt-lg">
                        Waiting for host to continue…
                    </p>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER: Voting Phase — Prompt + Vote Buttons
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="flex-col gap-lg w-full fade-in-up">
            {/* Round indicator */}
            <div className="flex-row justify-center">
                <span className="round-indicator">
                    Round {round} of {totalRounds}
                </span>
            </div>

            {/* Prompt Card */}
            <div className="glass-card prompt-card">
                <p className="prompt-text">{prompt}</p>
            </div>

            {/* Vote Buttons */}
            <div className="glass-card">
                <h3 style={{ marginBottom: "1rem" }}>
                    {hasVoted ? "Vote submitted ✓" : "Vote for a player"}
                </h3>

                <div className="vote-grid">
                    {playerEntries
                        .filter(([id]) => id !== currentUserId) // can't vote for yourself
                        .map(([id, player], index) => (
                            <button
                                key={id}
                                className={`vote-btn ${selectedVote === id ? "selected" : ""}`}
                                onClick={() => handleVote(id)}
                                disabled={hasVoted}
                            >
                                <div className={`player-avatar avatar-${index % 8}`}>
                                    {player.name?.charAt(0) || "?"}
                                </div>
                                <span style={{ fontWeight: 600 }}>{player.name}</span>
                            </button>
                        ))}
                </div>

                {hasVoted && (
                    <div className="status-bar mt-md">
                        <span className="status-dot" />
                        <span>{voteCount} / {playerCount} voted</span>
                    </div>
                )}
            </div>
        </div>
    );
}

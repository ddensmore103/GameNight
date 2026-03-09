/**
 * Truth or Dare Game Component
 *
 * Flow:
 *   1. A random player is selected (phase: "choose")
 *   2. That player picks Truth or Dare
 *   3. A random prompt is shown (phase: "prompt")
 *   4. Host presses "Next Round" → new random player
 *
 * All state is stored in Firebase gameState and received via props.
 */

import { useMemo } from "react";
import {
    chooseTruthOrDare,
    nextTruthOrDareRound,
    returnToGameSelection,
} from "../firebase/databaseHelpers";

export default function TruthOrDareGame({
    roomCode,
    players,
    gameState,
    isHost,
    currentUserId,
}) {
    const phase = gameState?.phase || "choose";
    const currentPlayer = gameState?.currentPlayer || null;
    const type = gameState?.type || null;
    const prompt = gameState?.prompt || "";
    const roundNumber = gameState?.roundNumber || 1;

    const playerEntries = useMemo(
        () => Object.entries(players || {}),
        [players]
    );
    const playerIds = useMemo(() => playerEntries.map(([id]) => id), [playerEntries]);

    // Resolve the current player's name
    const currentPlayerName = players?.[currentPlayer]?.name || "Unknown";
    const isMyTurn = currentUserId === currentPlayer;

    // ─── Handle Truth/Dare choice ─────────────────────────────────────────────
    async function handleChoice(choice) {
        if (!isMyTurn) return;
        try {
            await chooseTruthOrDare(roomCode, choice);
        } catch (err) {
            console.error("Failed to choose:", err);
        }
    }

    // ─── Handle Next Round ────────────────────────────────────────────────────
    async function handleNextRound() {
        if (!isHost) return;
        try {
            await nextTruthOrDareRound(roomCode, playerIds, currentPlayer);
        } catch (err) {
            console.error("Failed to advance round:", err);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER: Choose Phase — player picks Truth or Dare
    // ═════════════════════════════════════════════════════════════════════════
    if (phase === "choose") {
        return (
            <div className="flex-col gap-lg w-full fade-in-up">
                {/* Round indicator */}
                <div className="flex-row justify-center">
                    <span className="round-indicator">Round {roundNumber}</span>
                </div>

                {/* Current player spotlight */}
                <div className="glass-card prompt-card">
                    <p className="td-spotlight-label">It's your turn…</p>
                    <p className="td-spotlight-name">{currentPlayerName}</p>
                </div>

                {/* Truth / Dare buttons (only active for the chosen player) */}
                {isMyTurn ? (
                    <div className="td-choice-grid">
                        <button
                            className="td-choice-btn td-truth"
                            onClick={() => handleChoice("truth")}
                        >
                            <span className="td-choice-emoji">🤔</span>
                            <span className="td-choice-label">Truth</span>
                        </button>
                        <button
                            className="td-choice-btn td-dare"
                            onClick={() => handleChoice("dare")}
                        >
                            <span className="td-choice-emoji">🔥</span>
                            <span className="td-choice-label">Dare</span>
                        </button>
                    </div>
                ) : (
                    <p className="waiting-text">
                        Waiting for {currentPlayerName} to choose…
                    </p>
                )}
            </div>
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER: Prompt Phase — show the prompt
    // ═════════════════════════════════════════════════════════════════════════
    if (phase === "prompt") {
        return (
            <div className="flex-col gap-lg w-full fade-in-up">
                {/* Round indicator */}
                <div className="flex-row justify-center">
                    <span className="round-indicator">Round {roundNumber}</span>
                </div>

                {/* Type badge */}
                <div className="flex-row justify-center">
                    <span className={`td-type-badge ${type === "truth" ? "td-badge-truth" : "td-badge-dare"}`}>
                        {type === "truth" ? "🤔 Truth" : "🔥 Dare"}
                    </span>
                </div>

                {/* Player name */}
                <div className="text-center">
                    <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                        {currentPlayerName}
                    </p>
                </div>

                {/* Prompt */}
                <div className="glass-card prompt-card">
                    <p className="prompt-text">{prompt}</p>
                </div>

                {/* Next round (host only) */}
                {isHost ? (
                    <button
                        className="btn btn-primary btn-block"
                        onClick={handleNextRound}
                    >
                        Next Round →
                    </button>
                ) : (
                    <p className="waiting-text">Waiting for host to continue…</p>
                )}

                {/* Return to game selection (host only) */}
                {isHost && (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => returnToGameSelection(roomCode)}
                    >
                        ← Back to Games
                    </button>
                )}
            </div>
        );
    }

    // Fallback
    return null;
}

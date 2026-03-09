/**
 * Join Party Page
 *
 * Asks for a room code and player name, validates the room exists,
 * joins the player, and redirects to the lobby.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { joinRoom, getRoom } from "../firebase/databaseHelpers";

export default function JoinParty() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);

    async function handleJoin(e) {
        e.preventDefault();
        const trimmedCode = code.trim().toUpperCase();
        const trimmedName = name.trim();
        if (!trimmedCode || !trimmedName || !user) return;

        setJoining(true);
        setError(null);

        try {
            await joinRoom(trimmedCode, user.uid, trimmedName);

            // Save to session
            sessionStorage.setItem("gn_playerName", trimmedName);
            sessionStorage.setItem("gn_roomCode", trimmedCode);

            navigate(`/lobby/${trimmedCode}`);
        } catch (err) {
            console.error("Failed to join room:", err);
            setError(err.message || "Could not join room. Check the code and try again.");
            setJoining(false);
        }
    }

    if (authLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p className="text-muted">Signing in…</p>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-content fade-in-up">
                <h1 className="logo logo-sm">GameNight</h1>

                <div className="glass-card">
                    <h2 style={{ marginBottom: "0.5rem" }}>Join a Party</h2>
                    <p className="text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                        Enter the room code shared by your host.
                    </p>

                    <form onSubmit={handleJoin} className="flex-col gap-md">
                        <input
                            id="room-code-input"
                            className="input input-code"
                            type="text"
                            placeholder="ABCD"
                            maxLength={4}
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            style={{ alignSelf: "center" }}
                            autoFocus
                            required
                        />

                        <input
                            id="player-name-input"
                            className="input"
                            type="text"
                            placeholder="Your name"
                            maxLength={20}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        {error && <p className="error-message">{error}</p>}

                        <button
                            id="join-room-btn"
                            type="submit"
                            className="btn btn-accent btn-block"
                            disabled={code.trim().length < 4 || !name.trim() || joining}
                        >
                            {joining ? "Joining…" : "Join Room"}
                        </button>
                    </form>
                </div>

                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate("/")}
                >
                    ← Back
                </button>
            </div>
        </div>
    );
}

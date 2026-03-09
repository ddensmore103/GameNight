/**
 * Create Party Page
 *
 * Asks for the host's name, generates a room in Firebase,
 * and redirects to the lobby.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { createRoom, saveSession } from "../firebase/databaseHelpers";

export default function CreateParty() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    async function handleCreate(e) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed || !user) return;

        setCreating(true);
        setError(null);

        try {
            const roomCode = await createRoom(user.uid, trimmed);

            // Save session to localStorage for reconnect support
            saveSession(roomCode, trimmed, user.uid);

            navigate(`/lobby/${roomCode}`);
        } catch (err) {
            console.error("Failed to create room:", err);
            setError(err.message || "Failed to create room. Try again.");
            setCreating(false);
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
                    <h2 style={{ marginBottom: "0.5rem" }}>Create a Party</h2>
                    <p className="text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                        Choose a name and start a room for your friends.
                    </p>

                    <form onSubmit={handleCreate} className="flex-col gap-md">
                        <input
                            id="host-name-input"
                            className="input"
                            type="text"
                            placeholder="Your name"
                            maxLength={20}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            required
                        />

                        {error && <p className="error-message">{error}</p>}

                        <button
                            id="create-room-btn"
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={!name.trim() || creating}
                        >
                            {creating ? "Creating…" : "Create Room"}
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

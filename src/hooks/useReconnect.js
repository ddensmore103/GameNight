/**
 * useReconnect Hook
 *
 * On app startup, checks localStorage for a saved room session.
 * If one exists and the room is still alive in Firebase, the player
 * is automatically reconnected and redirected to the correct page
 * (lobby or game). If the room no longer exists, localStorage is cleared.
 *
 * This hook should be used once at the App level.
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { loadSession, reconnectToRoom, clearSession } from "../firebase/databaseHelpers";

/**
 * @returns {{ reconnecting: boolean }} - true while the reconnect attempt is in progress
 */
export function useReconnect() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [reconnecting, setReconnecting] = useState(true);

    useEffect(() => {
        // Wait for auth to finish before attempting reconnect
        if (authLoading) return;

        async function attemptReconnect() {
            const session = loadSession();

            // No saved session → nothing to reconnect to
            if (!session) {
                setReconnecting(false);
                return;
            }

            // If the user is already on a lobby or game page, skip reconnect
            // (they're already where they need to be)
            if (
                location.pathname.startsWith("/lobby/") ||
                location.pathname.startsWith("/game/")
            ) {
                setReconnecting(false);
                return;
            }

            // Use the current user's UID (Firebase may assign a new UID on a fresh
            // anonymous sign-in after clearing browser data, but usually persists)
            const uid = user?.uid || session.playerUID;

            try {
                const result = await reconnectToRoom(
                    session.roomCode,
                    uid,
                    session.playerName
                );

                if (result) {
                    // Room exists — redirect based on current game status
                    if (result.status === "playing" || result.status === "finished") {
                        navigate(`/game/${result.roomCode}`, { replace: true });
                    } else {
                        navigate(`/lobby/${result.roomCode}`, { replace: true });
                    }
                }
                // If result is null, reconnectToRoom already cleared localStorage
            } catch (err) {
                console.error("Reconnect failed:", err);
                clearSession();
            }

            setReconnecting(false);
        }

        attemptReconnect();
    }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

    return { reconnecting };
}

/**
 * useRoom Hook
 *
 * Subscribes to a room in Firebase Realtime Database and provides
 * live-updating room data to components. Automatically cleans up
 * the listener when the component unmounts or the room code changes.
 */

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/firebaseConfig";

/**
 * @param {string|null} roomCode - The 4-letter room code to subscribe to
 * @returns {{
 *   room: object|null,       - Full room data
 *   players: object|null,    - Players map { uid: { name, score } }
 *   gameState: object|null,  - Current game state
 *   hostId: string|null,     - UID of the host
 *   status: string|null,     - "lobby" | "playing" | "finished"
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useRoom(roomCode) {
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!roomCode) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Subscribe to the entire room node — any change triggers re-render
        const roomRef = ref(db, `rooms/${roomCode}`);
        const unsubscribe = onValue(
            roomRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setRoom(snapshot.val());
                    setError(null);
                } else {
                    setRoom(null);
                    setError("Room not found");
                }
                setLoading(false);
            },
            (err) => {
                console.error("Room listener error:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        // Cleanup: unsubscribe when roomCode changes or component unmounts
        return () => unsubscribe();
    }, [roomCode]);

    // Derive convenience properties from the room data
    const players = room?.players || null;
    const gameState = room?.gameState || null;
    const hostId = room?.hostId || null;
    const status = room?.status || null;

    return { room, players, gameState, hostId, status, loading, error };
}

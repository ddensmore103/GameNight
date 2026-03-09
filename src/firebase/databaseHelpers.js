/**
 * Database Helpers
 *
 * All read/write operations for rooms and game state.
 * These functions interact directly with Firebase Realtime Database.
 */

import { db } from "./firebaseConfig";
import {
    ref,
    set,
    get,
    update,
    remove,
    child,
    onDisconnect,
} from "firebase/database";

// ─── Prompts for "Most Likely To" ────────────────────────────────────────────
const PROMPTS = [
    "Most likely to forget their own birthday",
    "Most likely to become famous",
    "Most likely to survive a zombie apocalypse",
    "Most likely to accidentally go viral",
    "Most likely to cry during a movie",
    "Most likely to become a millionaire",
    "Most likely to get lost in their own city",
    "Most likely to laugh at the worst moment",
    "Most likely to eat something off the floor",
    "Most likely to show up late to everything",
    "Most likely to befriend a stranger on the bus",
    "Most likely to win a reality TV show",
    "Most likely to sleep through an alarm",
    "Most likely to text the wrong person",
    "Most likely to start a dance party",
];

/**
 * Generate a random 4-letter room code (uppercase A-Z).
 */
export function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed I and O to avoid confusion
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Shuffle an array using Fisher-Yates and return a copy.
 */
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Create a new room in Firebase.
 * The creator becomes the host and the first player in the room.
 *
 * @param {string} hostId  - Firebase auth UID of the host
 * @param {string} hostName - Display name chosen by the host
 * @returns {Promise<string>} The generated room code
 */
export async function createRoom(hostId, hostName) {
    // Generate a unique room code (retry if collision — unlikely)
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (attempts < 5) {
        const snapshot = await get(ref(db, `rooms/${roomCode}`));
        if (!snapshot.exists()) break;
        roomCode = generateRoomCode();
        attempts++;
    }

    // Build the initial room data
    const roomData = {
        hostId,
        status: "lobby", // "lobby" | "playing" | "finished"
        createdAt: Date.now(),
        players: {
            [hostId]: {
                name: hostName,
                score: 0,
            },
        },
        gameState: null,
    };

    // Write to Firebase
    await set(ref(db, `rooms/${roomCode}`), roomData);

    // Automatically clean up if the host disconnects unexpectedly
    onDisconnect(ref(db, `rooms/${roomCode}/players/${hostId}`)).remove();

    return roomCode;
}

/**
 * Join an existing room.
 *
 * @param {string} roomCode  - The 4-letter room code
 * @param {string} playerId  - Firebase auth UID
 * @param {string} playerName - Display name
 * @returns {Promise<boolean>} true if joined successfully
 */
export async function joinRoom(roomCode, playerId, playerName) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found. Check the code and try again.");
    }

    const room = snapshot.val();
    if (room.status !== "lobby") {
        throw new Error("This game has already started.");
    }

    // Add player to the room
    await set(ref(db, `rooms/${roomCode}/players/${playerId}`), {
        name: playerName,
        score: 0,
    });

    // Clean up if this player disconnects
    onDisconnect(ref(db, `rooms/${roomCode}/players/${playerId}`)).remove();

    return true;
}

/**
 * Remove a player from a room.
 */
export async function leaveRoom(roomCode, playerId) {
    await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
}

/**
 * Check if a room exists and return its data.
 */
export async function getRoom(roomCode) {
    const snapshot = await get(ref(db, `rooms/${roomCode}`));
    if (!snapshot.exists()) return null;
    return snapshot.val();
}

/**
 * Start the game — sets status to "playing" and initializes game state.
 * Only the host should call this.
 *
 * @param {string} roomCode - The room to start
 */
export async function startGame(roomCode) {
    const totalRounds = 5;

    // Pick random prompts for this session
    const shuffled = shuffle(PROMPTS);
    const selectedPrompts = shuffled.slice(0, totalRounds);

    const gameState = {
        currentGame: "mostLikelyTo",
        round: 1,
        totalRounds,
        prompt: selectedPrompts[0],
        prompts: selectedPrompts, // store all prompts so we can advance rounds
        votes: {},
        phase: "voting", // "voting" | "results"
    };

    await update(ref(db, `rooms/${roomCode}`), {
        status: "playing",
        gameState,
    });
}

/**
 * Submit a vote for the current round.
 *
 * @param {string} roomCode    - Room code
 * @param {string} playerId    - Who is voting
 * @param {string} votedForId  - Who they voted for
 */
export async function submitVote(roomCode, playerId, votedForId) {
    await set(
        ref(db, `rooms/${roomCode}/gameState/votes/${playerId}`),
        votedForId
    );
}

/**
 * Reveal votes — sets phase to "results" and updates scores.
 * Call this when all players have voted.
 */
export async function revealVotes(roomCode) {
    const roomSnapshot = await get(ref(db, `rooms/${roomCode}`));
    const room = roomSnapshot.val();

    const votes = room.gameState?.votes || {};
    const players = room.players || {};

    // Count votes per player
    const voteCounts = {};
    Object.values(votes).forEach((votedForId) => {
        voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
    });

    // Find the player with the most votes and award them a point
    let maxVotes = 0;
    let winners = [];
    Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            winners = [playerId];
        } else if (count === maxVotes) {
            winners.push(playerId);
        }
    });

    // Update scores
    const scoreUpdates = {};
    winners.forEach((winnerId) => {
        const currentScore = players[winnerId]?.score || 0;
        scoreUpdates[`players/${winnerId}/score`] = currentScore + 1;
    });

    await update(ref(db, `rooms/${roomCode}`), {
        ...scoreUpdates,
        "gameState/phase": "results",
    });
}

/**
 * Advance to the next round, or finish the game if all rounds are done.
 */
export async function nextRound(roomCode) {
    const roomSnapshot = await get(ref(db, `rooms/${roomCode}`));
    const room = roomSnapshot.val();

    const currentRound = room.gameState.round;
    const totalRounds = room.gameState.totalRounds;

    if (currentRound >= totalRounds) {
        // Game over
        await update(ref(db, `rooms/${roomCode}`), {
            status: "finished",
            "gameState/phase": "finished",
        });
        return;
    }

    // Advance to next round
    const nextRoundNum = currentRound + 1;
    const prompts = room.gameState.prompts;

    await update(ref(db, `rooms/${roomCode}/gameState`), {
        round: nextRoundNum,
        prompt: prompts[nextRoundNum - 1],
        votes: {},
        phase: "voting",
    });
}

/**
 * Reset the room back to lobby state so players can play again.
 */
export async function returnToLobby(roomCode) {
    await update(ref(db, `rooms/${roomCode}`), {
        status: "lobby",
        gameState: null,
    });
}

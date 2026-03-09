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

// ─── Prompts for "Truth or Dare" ──────────────────────────────────────────────
const TRUTH_PROMPTS = [
    "What is your most embarrassing moment?",
    "Who in this room would survive a zombie apocalypse?",
    "What is a secret you've never told anyone?",
    "What's the most childish thing you still do?",
    "What's the weirdest dream you've ever had?",
    "Who was your first crush?",
    "What's the last lie you told?",
    "What's your guilty pleasure song?",
    "If you could swap lives with someone in this room, who?",
    "What's the most embarrassing thing on your phone?",
    "What's the dumbest thing you've ever Googled?",
    "What would your autobiography be called?",
];

const DARE_PROMPTS = [
    "Do 10 pushups right now",
    "Speak in an accent for the next round",
    "Let another player post something on your social media",
    "Do your best impression of another player",
    "Send a weird emoji to the last person you texted",
    "Talk without closing your mouth for 30 seconds",
    "Act out a scene from your favorite movie",
    "Let the group give you a new nickname for the rest of the game",
    "Sing the chorus of the last song you listened to",
    "Do your best animal impression",
    "Keep a straight face while others try to make you laugh for 30 seconds",
    "Dance with no music for 15 seconds",
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
                connected: true,
            },
        },
        gameState: null,
    };

    // Write to Firebase
    await set(ref(db, `rooms/${roomCode}`), roomData);

    // Mark player as disconnected (not removed) if the tab closes
    setupPresence(roomCode, hostId);

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

    // Allow rejoining if the player already exists (reconnect case)
    const existingPlayer = room.players?.[playerId];
    if (!existingPlayer && room.status !== "lobby") {
        throw new Error("This game has already started.");
    }

    // Add (or update) the player in the room, preserving score if reconnecting
    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
        name: playerName,
        score: existingPlayer?.score || 0,
        connected: true,
    });

    // Mark as disconnected (not removed) if the tab closes
    setupPresence(roomCode, playerId);

    return true;
}

/**
 * Remove a player from a room (intentional leave).
 */
export async function leaveRoom(roomCode, playerId) {
    // Cancel the onDisconnect handler before removing
    onDisconnect(ref(db, `rooms/${roomCode}/players/${playerId}/connected`)).cancel();
    await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));

    // Clear saved session so reconnect doesn't trigger
    clearSession();
}

/**
 * Check if a room exists and return its data.
 */
export async function getRoom(roomCode) {
    const snapshot = await get(ref(db, `rooms/${roomCode}`));
    if (!snapshot.exists()) return null;
    return snapshot.val();
}

// ─── Reconnect Support ───────────────────────────────────────────────────────

/**
 * Set up Firebase presence — marks the player as disconnected (not removed)
 * when the browser tab closes or loses connection.
 */
function setupPresence(roomCode, playerId) {
    const connectedRef = ref(db, `rooms/${roomCode}/players/${playerId}/connected`);
    onDisconnect(connectedRef).set(false);
}

/**
 * Save the current session to localStorage so the app can reconnect after refresh.
 */
export function saveSession(roomCode, playerName, playerUID) {
    localStorage.setItem("gn_roomCode", roomCode);
    localStorage.setItem("gn_playerName", playerName);
    localStorage.setItem("gn_playerUID", playerUID);
}

/**
 * Clear the saved session from localStorage.
 */
export function clearSession() {
    localStorage.removeItem("gn_roomCode");
    localStorage.removeItem("gn_playerName");
    localStorage.removeItem("gn_playerUID");
}

/**
 * Load saved session from localStorage.
 * @returns {{ roomCode: string, playerName: string, playerUID: string } | null}
 */
export function loadSession() {
    const roomCode = localStorage.getItem("gn_roomCode");
    const playerName = localStorage.getItem("gn_playerName");
    const playerUID = localStorage.getItem("gn_playerUID");

    if (roomCode && playerName && playerUID) {
        return { roomCode, playerName, playerUID };
    }
    return null;
}

/**
 * Attempt to reconnect to a previously joined room.
 * - Verifies the room still exists
 * - Re-marks the player as connected (does NOT create a duplicate)
 * - Sets up presence/onDisconnect again
 *
 * @returns {{ roomCode: string, status: string }} on success, or null on failure
 */
export async function reconnectToRoom(roomCode, playerId, playerName) {
    const room = await getRoom(roomCode);

    // Room no longer exists
    if (!room) {
        clearSession();
        return null;
    }

    // Re-add or update the player entry (same UID = no duplicate)
    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
        name: playerName,
        connected: true,
        // Preserve existing score if the player was already in the room
        ...(room.players?.[playerId]?.score != null
            ? { score: room.players[playerId].score }
            : { score: 0 }),
    });

    // Re-setup presence for this tab
    setupPresence(roomCode, playerId);

    return { roomCode, status: room.status };
}

/**
 * Transition room to "playing" status — enters the game selection screen.
 * No specific game is started yet; the host will pick one on the next screen.
 */
export async function startGame(roomCode) {
    await update(ref(db, `rooms/${roomCode}`), {
        status: "playing",
        gameState: null, // null = game selection screen
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// "Most Likely To" — Game Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the "Most Likely To" game.
 * Sets up rounds, shuffled prompts, and the voting phase.
 */
export async function startMostLikelyTo(roomCode) {
    const totalRounds = 5;
    const shuffled = shuffle(PROMPTS);
    const selectedPrompts = shuffled.slice(0, totalRounds);

    const gameState = {
        currentGame: "mostLikelyTo",
        round: 1,
        totalRounds,
        prompt: selectedPrompts[0],
        prompts: selectedPrompts,
        votes: {},
        phase: "voting",
    };

    await update(ref(db, `rooms/${roomCode}`), { gameState });
}

// ═══════════════════════════════════════════════════════════════════════════════
// "Truth or Dare" — Game Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the "Truth or Dare" game.
 * Picks a random player to go first.
 *
 * @param {string} roomCode - Room code
 * @param {string[]} playerIds - Array of player UIDs in the room
 */
export async function startTruthOrDare(roomCode, playerIds) {
    const randomIndex = Math.floor(Math.random() * playerIds.length);

    const gameState = {
        currentGame: "truthOrDare",
        phase: "choose",  // "choose" | "prompt" | "finished"
        currentPlayer: playerIds[randomIndex],
        type: null,        // "truth" | "dare" (set after player chooses)
        prompt: null,
        roundNumber: 1,
    };

    await update(ref(db, `rooms/${roomCode}`), { gameState });
}

/**
 * The current player chose Truth or Dare — pick a random prompt and show it.
 *
 * @param {string} roomCode
 * @param {"truth"|"dare"} type
 */
export async function chooseTruthOrDare(roomCode, type) {
    const prompts = type === "truth" ? TRUTH_PROMPTS : DARE_PROMPTS;
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    await update(ref(db, `rooms/${roomCode}/gameState`), {
        type,
        prompt: randomPrompt,
        phase: "prompt",
    });
}

/**
 * Advance to the next round in Truth or Dare.
 * Picks the next random player (avoiding the current one if possible).
 *
 * @param {string} roomCode
 * @param {string[]} playerIds
 * @param {string} currentPlayerId - UID of the player who just went
 */
export async function nextTruthOrDareRound(roomCode, playerIds, currentPlayerId) {
    // Pick a different player if possible
    const otherPlayers = playerIds.filter((id) => id !== currentPlayerId);
    const pool = otherPlayers.length > 0 ? otherPlayers : playerIds;
    const nextPlayer = pool[Math.floor(Math.random() * pool.length)];

    await update(ref(db, `rooms/${roomCode}/gameState`), {
        phase: "choose",
        currentPlayer: nextPlayer,
        type: null,
        prompt: null,
        roundNumber: (await get(ref(db, `rooms/${roomCode}/gameState/roundNumber`))).val() + 1,
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

/**
 * Return to the game selection screen (keep status as "playing" but clear game).
 */
export async function returnToGameSelection(roomCode) {
    await update(ref(db, `rooms/${roomCode}`), {
        gameState: null,
    });
}

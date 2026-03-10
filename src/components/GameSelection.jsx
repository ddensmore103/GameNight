/**
 * GameSelection Component
 *
 * Displays a grid of available games for the host to choose from.
 * Non-host players see a waiting screen.
 * When a game is selected, gameState.currentGame is set in Firebase
 * and all clients automatically load that game.
 */

import GameCard from "./GameCard";
import {
    startMostLikelyTo,
    startTruthOrDare,
    startGuessTheEmoji,
    toggleGameVote,
} from "../firebase/databaseHelpers";

// ─── Game Registry ───────────────────────────────────────────────────────────
// Add new games here and they'll appear on the selection screen automatically.
const GAMES = [
    {
        id: "mostLikelyTo",
        emoji: "🗳️",
        title: "Who's Most Likely To?",
        description: "Vote on who fits the prompt best. Most votes wins the round!",
    },
    {
        id: "truthOrDare",
        emoji: "🔥",
        title: "Truth or Dare",
        description: "Pick truth or dare, answer the prompt, and pass it on!",
    },
    {
        id: "guessTheEmoji",
        emoji: "🧩",
        title: "Guess The Emoji",
        description: "Guess the movie, phrase, or object represented by emojis.",
    },
];

export default function GameSelection({ roomCode, players, isHost, gameVotes, currentUserId }) {
    const playerIds = players ? Object.keys(players) : [];

    // Handler: host picks a game → write to Firebase
    async function handleSelectGame(gameId) {
        if (!isHost) return;

        try {
            if (gameId === "mostLikelyTo") {
                await startMostLikelyTo(roomCode, playerIds);
            } else if (gameId === "truthOrDare") {
                await startTruthOrDare(roomCode, playerIds);
            } else if (gameId === "guessTheEmoji") {
                await startGuessTheEmoji(roomCode, playerIds);
            }
        } catch (err) {
            console.error("Failed to start game:", err);
        }
    }

    // Handler: players vote for a game
    async function handleVote(gameId) {
        if (isHost) return;
        try {
            await toggleGameVote(roomCode, gameId, currentUserId);
        } catch (err) {
            console.error("Failed to toggle vote:", err);
        }
    }

    return (
        <div className="flex-col gap-lg w-full fade-in-up">
            <div className="text-center">
                <h2 style={{ marginBottom: "0.25rem" }}>Choose a Game</h2>
                {isHost ? (
                    <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                        Pick a game to play with your party!
                    </p>
                ) : (
                    <p className="waiting-text" style={{ fontSize: "0.9rem" }}>
                        Waiting for host to pick a game…
                    </p>
                )}
            </div>

            <div className="game-grid">
                {GAMES.map((game) => {
                    const votesForGame = gameVotes?.[game.id] || {};
                    const votesCount = Object.keys(votesForGame).length;
                    const hasVoted = currentUserId in votesForGame;

                    return (
                        <GameCard
                            key={game.id}
                            emoji={game.emoji}
                            title={game.title}
                            description={game.description}
                            onStart={() => handleSelectGame(game.id)}
                            onVote={() => handleVote(game.id)}
                            isHost={isHost}
                            votesCount={votesCount}
                            hasVoted={hasVoted}
                        />
                    );
                })}
            </div>
        </div>
    );
}

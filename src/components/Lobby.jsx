/**
 * Lobby Component
 *
 * Composite component used by LobbyPage — shows the room code,
 * player list, and host controls. This is a presentational wrapper.
 */

import PlayerList from "./PlayerList";

export default function Lobby({ roomCode, players, hostId, isHost, playerCount, onStartGame }) {
    return (
        <div className="flex-col gap-lg items-center w-full">
            {/* Room Code */}
            <div className="room-code-display">
                <span className="label">Room Code</span>
                <span
                    className="room-code"
                    title="Click to copy"
                    onClick={() => navigator.clipboard.writeText(roomCode)}
                >
                    {roomCode}
                </span>
                <span className="room-code-hint">Share this code with your friends</span>
            </div>

            {/* Player List Card */}
            <div className="glass-card">
                <div className="flex-row justify-between items-center" style={{ marginBottom: "1rem" }}>
                    <h3>Players</h3>
                    <div className="status-bar">
                        <span className="status-dot" />
                        <span>{playerCount} connected</span>
                    </div>
                </div>

                <PlayerList players={players} hostId={hostId} />
            </div>

            {/* Host Start Button */}
            {isHost ? (
                <button
                    id="start-game-btn"
                    className="btn btn-primary btn-block"
                    onClick={onStartGame}
                    disabled={playerCount < 2}
                >
                    {playerCount < 2 ? "Waiting for players…" : "🚀 Start Game"}
                </button>
            ) : (
                <p className="waiting-text">Waiting for host to start the game…</p>
            )}
        </div>
    );
}

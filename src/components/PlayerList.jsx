/**
 * PlayerList Component
 *
 * Renders a list of players with colored initial avatars,
 * names, and a host badge.
 */

/**
 * @param {{ 
 *   players: object, 
 *   hostId: string, 
 *   currentUserId?: string,
 *   onTransferHost?: (playerId: string) => void,
 *   showScores?: boolean 
 * }}
 */
export default function PlayerList({
    players,
    hostId,
    currentUserId,
    onTransferHost,
    showScores = false
}) {
    if (!players) return null;

    const entries = Object.entries(players);
    const isCurrentUserHost = currentUserId === hostId;

    return (
        <div className="player-list stagger">
            {entries.map(([playerId, player], index) => (
                <div key={playerId} className="player-item">
                    {/* Colored avatar with first initial */}
                    <div className={`player-avatar avatar-${index % 8}`}>
                        {player.name?.charAt(0) || "?"}
                    </div>

                    {/* Name + host badge */}
                    <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        {playerId === hostId && (
                            <span className="player-badge">👑 Host</span>
                        )}
                    </div>

                    {/* Score or Action Buttons */}
                    <div className="player-actions">
                        {showScores && (
                            <span className="player-score">{player.score || 0}</span>
                        )}

                        {/* Host controls: transfer hosting */}
                        {!showScores && isCurrentUserHost && playerId !== hostId && (
                            <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => onTransferHost?.(playerId)}
                            >
                                Make Host
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

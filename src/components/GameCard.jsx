/**
 * GameCard Component
 *
 * A reusable card for the game selection screen.
 * Shows game name, emoji, description, and a play button.
 */

export default function GameCard({
    emoji,
    title,
    description,
    onStart,
    onVote,
    isHost,
    votesCount,
    hasVoted,
}) {
    return (
        <div className={`game-card ${hasVoted ? "voted" : ""}`}>
            {/* Vote Badge (visible when there are votes) */}
            {votesCount > 0 && (
                <div className="vote-badge">
                    <span>👍 {votesCount}</span>
                </div>
            )}

            <div className="game-card-emoji">{emoji}</div>
            <div className="game-card-info">
                <h3 className="game-card-title">{title}</h3>
                <p className="game-card-desc">{description}</p>
            </div>

            {isHost ? (
                <button
                    className="btn btn-primary btn-block btn-sm"
                    onClick={onStart}
                >
                    ▶ Play
                </button>
            ) : (
                <button
                    className={`btn btn-block btn-sm ${hasVoted ? "btn-accent" : "btn-secondary"}`}
                    onClick={onVote}
                >
                    {hasVoted ? "✓ Voted" : "👍 Vote"}
                </button>
            )}
        </div>
    );
}

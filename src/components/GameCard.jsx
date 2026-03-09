/**
 * GameCard Component
 *
 * A reusable card for the game selection screen.
 * Shows game name, emoji, description, and a play button.
 */

export default function GameCard({ emoji, title, description, onStart, disabled }) {
    return (
        <div className="game-card">
            <div className="game-card-emoji">{emoji}</div>
            <div className="game-card-info">
                <h3 className="game-card-title">{title}</h3>
                <p className="game-card-desc">{description}</p>
            </div>
            <button
                className="btn btn-primary btn-block btn-sm"
                onClick={onStart}
                disabled={disabled}
            >
                ▶ Play
            </button>
        </div>
    );
}

import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/firebaseConfig";

/**
 * Live Guess Feed for "Guess The Emoji"
 * Subscribes specifically to `gameState/guesses` to display a scrolling,
 * real-time list of all guesses made by players.
 */
export default function GuessFeed({ roomCode, phase }) {
    const [guesses, setGuesses] = useState([]);
    const feedEndRef = useRef(null);

    // Subscribe ONLY to the guesses node to prevent re-rendering the entire game tree
    // every time someone types a character or submits a fast guess.
    useEffect(() => {
        if (!roomCode) return;

        const guessesRef = ref(db, `rooms/${roomCode}/gameState/guesses`);
        const unsubscribe = onValue(guessesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                // Convert object to array and sort by timestamp
                const sortedGuesses = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
                setGuesses(sortedGuesses);
            } else {
                setGuesses([]);
            }
        });

        return () => unsubscribe();
    }, [roomCode]);

    // Auto-scroll to bottom of feed whenever new guesses arrive
    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [guesses]);

    return (
        <div className="glass-card fade-in" style={{ padding: "1rem", flex: "1", display: "flex", flexDirection: "column" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                Live Feed
            </h4>

            <div
                style={{
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem",
                    height: "200px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                }}
            >
                {guesses.length === 0 ? (
                    <p className="text-muted text-center" style={{ fontStyle: "italic", marginTop: "auto", marginBottom: "auto" }}>
                        No guesses yet...
                    </p>
                ) : (
                    guesses.map((guess, index) => (
                        <div
                            key={index}
                            style={{
                                padding: "0.5rem 0.75rem",
                                borderRadius: "var(--radius-sm)",
                                backgroundColor: guess.correct ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.05)",
                                borderLeft: guess.correct ? "3px solid var(--accent-success)" : "3px solid transparent",
                                fontSize: "0.95rem",
                                animation: "fadeIn 0.2s ease-out"
                            }}
                        >
                            <span style={{ fontWeight: "600", color: guess.correct ? "var(--accent-success)" : "var(--text-primary)" }}>
                                {guess.playerName}:
                            </span>
                            <span style={{ marginLeft: "0.5rem", color: guess.correct ? "var(--accent-success)" : "var(--text-secondary)" }}>
                                {guess.correct && phase === "guessing" ? guess.text.replace(/[^\s]/g, '-') : guess.text}
                            </span>
                        </div>
                    ))
                )}
                {/* Scroll anchor */}
                <div ref={feedEndRef} />
            </div>
        </div>
    );
}

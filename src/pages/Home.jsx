/**
 * Home Page
 *
 * Landing page with three main actions:
 *  - Create Party — host a new room
 *  - Join Party — enter an existing room code
 *  - Play Solo — play games alone (placeholder for future)
 */

import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <div className="page-content fade-in-up">
                {/* Hero */}
                <div className="home-emoji">🎮</div>
                <h1 className="logo">GameNight</h1>
                <p className="subtitle">
                    Party games you can play with friends — right in your browser.
                </p>

                {/* Action Buttons */}
                <div className="home-actions" style={{ marginTop: "1rem" }}>
                    <button
                        id="create-party-btn"
                        className="btn btn-primary btn-block"
                        onClick={() => navigate("/create")}
                    >
                        🎉 Create Party
                    </button>
                    <button
                        id="join-party-btn"
                        className="btn btn-accent btn-block"
                        onClick={() => navigate("/join")}
                    >
                        🔗 Join Party
                    </button>
                    <button
                        id="play-solo-btn"
                        className="btn btn-secondary btn-block"
                        onClick={() => alert("Solo mode coming soon!")}
                    >
                        🎯 Play Solo
                    </button>
                </div>
            </div>
        </div>
    );
}

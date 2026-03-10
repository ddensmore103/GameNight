/**
 * Home Page
 *
 * Landing page with three main actions:
 *  - Create Party — host a new room
 *  - Join Party — enter an existing room code
 *  - Play Solo — play games alone (placeholder for future)
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
    const navigate = useNavigate();
    const { user, isGuest, logoutUser } = useAuth();

    return (
        <div className="page" style={{ position: "relative" }}>
            {/* Header: Auth Status */}
            <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
                {isGuest ? (
                    <div className="flex-row gap-xs">
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate("/login")}>Sign In</button>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate("/signup")}>Create Profile</button>
                    </div>
                ) : (
                    <div className="flex-row gap-sm items-center">
                        <span className="text-muted" style={{ fontSize: "0.9rem" }}>{user?.email || "Player"}</span>
                        <button className="btn btn-secondary btn-sm" onClick={logoutUser}>Log Out</button>
                    </div>
                )}
            </div>

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

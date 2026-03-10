import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AuthPage({ defaultMode = "login" }) {
    const { loginWithGoogle, signUpWithEmail, loginWithEmail } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState(defaultMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleEmailSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === "signup") {
                await signUpWithEmail(email, password);
            } else {
                await loginWithEmail(email, password);
            }
            navigate("/"); // Redirect to home after success
        } catch (err) {
            let msg = err.message || "Authentication failed.";
            if (msg.includes("auth/invalid-credential")) msg = "Invalid email or password.";
            if (msg.includes("auth/email-already-in-use")) msg = "This email is already in use.";
            if (msg.includes("auth/weak-password")) msg = "Password should be at least 6 characters.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleClick() {
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate("/");
        } catch (err) {
            let msg = err.message || "Google sign-in failed.";
            if (msg.includes("auth/popup-closed-by-user")) msg = "Sign-in popup was closed before finishing.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page fade-in">
            <div className="page-content" style={{ maxWidth: "480px", width: "100%", margin: "0 auto" }}>
                <div className="flex-row items-center w-full" style={{ marginBottom: "2rem" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                </div>

                <div className="glass-card stagger" style={{ padding: "2.5rem" }}>
                    <div className="text-center" style={{ marginBottom: "2rem" }}>
                        <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
                            {mode === "login" ? "Welcome Back" : "Grab Your Player Tag"}
                        </h2>
                        <p className="text-muted">
                            {mode === "login"
                                ? "Sign in to resume your progress and see your stats."
                                : "Create a unique profile to save your scores across games."
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="status-bar" style={{ backgroundColor: "rgba(244, 63, 94, 0.1)", color: "var(--accent-danger)", marginBottom: "1.5rem", justifyContent: "center" }}>
                            <span className="status-dot" style={{ backgroundColor: "var(--accent-danger)" }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        className="btn btn-secondary btn-block flex-row items-center justify-center gap-sm"
                        onClick={handleGoogleClick}
                        disabled={loading}
                        style={{ marginBottom: "1.5rem" }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="flex-row items-center gap-sm" style={{ marginBottom: "1.5rem" }}>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
                        <span className="text-muted" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Or</span>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
                    </div>

                    <form onSubmit={handleEmailSubmit} className="flex-col gap-md">
                        <input
                            type="email"
                            className="input"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <input
                            type="password"
                            className="input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            minLength={6}
                        />

                        <button
                            type="submit"
                            className="btn btn-primary btn-block mt-sm"
                            disabled={loading}
                        >
                            {loading ? "Please wait..." : (mode === "login" ? "Sign In" : "Claim Player Tag")}
                        </button>
                    </form>

                    <p className="text-center text-muted" style={{ marginTop: "2rem", fontSize: "0.9rem" }}>
                        {mode === "login" ? "New to GameNight? " : "Already have a tag? "}
                        <button
                            type="button"
                            className="btn btn-link"
                            style={{ padding: 0, height: "auto", fontSize: "inherit" }}
                            onClick={() => {
                                setMode(mode === "login" ? "signup" : "login");
                                setError(null);
                            }}
                            disabled={loading}
                        >
                            {mode === "login" ? "Create Profile" : "Sign In"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

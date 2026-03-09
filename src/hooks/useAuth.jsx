/**
 * useAuth Hook
 *
 * Signs the user in anonymously on first load and provides the
 * Firebase auth user object to the rest of the app.
 */

import { useState, useEffect, createContext, useContext } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

// ─── Auth Context ────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and ensures the user is signed in anonymously.
 * All child components can access the auth state via useAuth().
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setLoading(false);
            } else {
                // No user signed in — trigger anonymous sign-in
                signInAnonymously(auth).catch((err) => {
                    console.error("Anonymous sign-in failed:", err);
                    setLoading(false);
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access the current auth state.
 * @returns {{ user: import("firebase/auth").User | null, loading: boolean }}
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

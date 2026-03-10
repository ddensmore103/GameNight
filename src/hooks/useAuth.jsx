/**
 * useAuth Hook
 *
 * Signs the user in anonymously on first load and provides the
 * Firebase auth user object to the rest of the app.
 */

import { useState, useEffect, createContext, useContext } from "react";
import {
    signInAnonymously,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    linkWithCredential,
    EmailAuthProvider,
    signOut
} from "firebase/auth";
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

    // ─── Authentication Helpers ───────────────────────────────────────────────

    const googleProvider = new GoogleAuthProvider();

    async function loginWithGoogle() {
        try {
            // First sign in with Google
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Google sign-in error:", error);
            throw error;
        }
    }

    async function signUpWithEmail(email, password) {
        try {
            if (user && user.isAnonymous) {
                // Link current anonymous account to email/password so stats aren't lost
                const credential = EmailAuthProvider.credential(email, password);
                const result = await linkWithCredential(user, credential);
                return result.user;
            } else {
                // Rare case where they aren't signed in anonymously for some reason
                const result = await createUserWithEmailAndPassword(auth, email, password);
                return result.user;
            }
        } catch (error) {
            console.error("Email sign-up error:", error);
            throw error;
        }
    }

    async function loginWithEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.error("Email login error:", error);
            throw error;
        }
    }

    async function logoutUser() {
        try {
            await signOut(auth);
            // After sign out, the onAuthStateChanged listener will catch that
            // there is no user, and trigger the anonymous sign-in fallback automatically!
        } catch (error) {
            console.error("Sign-out error:", error);
            throw error;
        }
    }

    const value = {
        user,
        loading,
        isGuest: user ? user.isAnonymous : true,
        loginWithGoogle,
        signUpWithEmail,
        loginWithEmail,
        logoutUser,
    };

    return (
        <AuthContext.Provider value={value}>
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

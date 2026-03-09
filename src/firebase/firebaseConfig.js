/**
 * Firebase Configuration
 *
 * Replace the placeholder values below with your actual Firebase project config.
 * You can find these values in the Firebase Console:
 *   Project Settings → General → Your apps → Firebase SDK snippet → Config
 *
 * Required Firebase services:
 *   1. Authentication → Enable "Anonymous" sign-in method
 *   2. Realtime Database → Create database in test mode
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBZYNfsOcZZLISApo5LYNRlNfn0i9sm8UY",
    authDomain: "game-night-platform.firebaseapp.com",
    databaseURL: "https://game-night-platform-default-rtdb.firebaseio.com",
    projectId: "game-night-platform",
    storageBucket: "game-night-platform.firebasestorage.app",
    messagingSenderId: "517629110178",
    appId: "1:517629110178:web:13ef8bec0fb9646923f4fb",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Firebase Authentication — used for anonymous sign-in
export const auth = getAuth(app);

// Firebase Realtime Database — used for room/game state sync
export const db = getDatabase(app);

export default app;

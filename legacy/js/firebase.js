// =========================================================
// MatchIQ - Firebase Configuration
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// =========================================================
// FIREBASE CONFIG
// =========================================================

const firebaseConfig = {

    apiKey: "AIzaSyAo3hGXzAcscs3hgShblwdpsZnTJreFUmM",

    authDomain: "matchiq-9f263.firebaseapp.com",

    projectId: "matchiq-9f263",

    storageBucket: "matchiq-9f263.firebasestorage.app",

    messagingSenderId: "525622971619",

    appId: "1:525622971619:web:b48fb6ceecef26f286c9d6",

    measurementId: "G-KZLK2XXNQQ"

};


// =========================================================
// INITIALISE FIREBASE
// =========================================================

const app = initializeApp(firebaseConfig);

// =========================================================
// FIREBASE SERVICES
// =========================================================

export const auth = getAuth(app);

export const db = getFirestore(app);

// =========================================================
// MATCHIQ DATABASE API
// =========================================================

window.MatchIQDatabase = {

    async saveMatch(match) {

        const user =
            window.MatchIQUser;

        if (!user || !user.uid) {

            console.warn(
                "Cannot save match: no logged-in user."
            );

            return false;
        }

        if (!match || !match.id) {

            console.warn(
                "Cannot save match: invalid match."
            );

            return false;
        }

        try {

            const matchRef =
                doc(
                    db,
                    "users",
                    user.uid,
                    "matches",
                    match.id
                );

            await setDoc(
                matchRef,
                {
                    ...match,

                    updatedAt:
                        serverTimestamp(),

                    ownerUid:
                        user.uid
                },
                {
                    merge: true
                }
            );

            console.log(
                "🔥 Match saved to Firestore:",
                match.id
            );

            return true;

        } catch (error) {

            console.error(
                "❌ Failed to save match to Firestore:",
                error
            );

            return false;
        }
    },


    async getMatches() {

        const user =
            window.MatchIQUser;

        if (!user || !user.uid) {

            return [];
        }

        try {

            const matchesRef =
                collection(
                    db,
                    "users",
                    user.uid,
                    "matches"
                );

            const snapshot =
                await getDocs(
                    matchesRef
                );

            return snapshot.docs.map(
                doc => ({
                    ...doc.data(),
                    id: doc.id
                })
            );

        } catch (error) {

            console.error(
                "❌ Failed to load matches:",
                error
            );

            return [];
        }
    },


    async getMatch(matchId) {

        const user =
            window.MatchIQUser;

        if (!user || !user.uid) {

            return null;
        }

        try {

            const matchRef =
                doc(
                    db,
                    "users",
                    user.uid,
                    "matches",
                    matchId
                );

            const snapshot =
                await getDoc(
                    matchRef
                );

            if (!snapshot.exists()) {

                return null;
            }

            return {
                ...snapshot.data(),
                id: snapshot.id
            };

        } catch (error) {

            console.error(
                "❌ Failed to load match:",
                error
            );

            return null;
        }
    },


    async deleteMatch(matchId) {

        const user =
            window.MatchIQUser;

        if (!user || !user.uid) {

            return false;
        }

        try {

            const matchRef =
                doc(
                    db,
                    "users",
                    user.uid,
                    "matches",
                    matchId
                );

            await deleteDoc(
                matchRef
            );

            console.log(
                "🗑️ Match deleted from Firestore:",
                matchId
            );

            return true;

        } catch (error) {

            console.error(
                "❌ Failed to delete match:",
                error
            );

            return false;
        }
    }

};

// Make Firebase services available to the existing MatchIQ
// application code.
window.matchIQAuth = auth;
window.matchIQDb = db;

// =========================================================
// CONNECTION TEST
// =========================================================

console.log(
    "🔥 MatchIQ Firebase connected successfully!"
);

console.log(
    "Firebase project:",
    firebaseConfig.projectId
);

console.log(
    "🔥 MatchIQ Firestore initialized!"
);

window.matchIQAuth = auth;
window.matchIQDb = db;

window.matchIQFirebaseReady = true;
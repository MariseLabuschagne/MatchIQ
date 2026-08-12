/*
=====================================================
MATCHIQ STORAGE
=====================================================

LocalStorage = local cache / fallback
Firestore    = persistent database

Firestore structure:

users
  └── {userId}
       └── matches
            └── {matchId}

=====================================================
*/

const STORAGE_KEYS = {

    currentMatch:
        "matchiq-current-match"

};


/*
=====================================================
FIRESTORE HELPERS
=====================================================
*/

function getFirebaseUser() {

    const auth =
        window.matchIQAuth;

    if (!auth) {

        console.warn(
            "Firebase Auth is not available."
        );

        return null;

    }

    return auth.currentUser || null;

}


function getFirestoreDatabase() {

    return (
        window.matchIQDb ||
        null
    );

}


/*
=====================================================
SAVE MATCH TO FIRESTORE
=====================================================
*/

async function saveMatchToFirestore(
    match
) {

    if (!match) {

        return false;

    }

    const db =
        getFirestoreDatabase();

    const user =
        getFirebaseUser();

    if (!db || !user) {

        console.warn(
            "Firestore save skipped - no Firebase user."
        );

        return false;

    }

    try {

        /*
        Import Firestore functions dynamically.

        This allows storage.js to remain a normal
        JavaScript file rather than converting the
        entire application to modules.
        */

        const {
            doc,
            setDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"
        );

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

                userId:
                    user.uid,

                updatedAt:
                    new Date().toISOString(),

                status:
                    match.completedAt
                        ? "completed"
                        : "active"
            },
            {
                merge: true
            }
        );

        console.log(
            "☁️ Match saved to Firestore:",
            match.id
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Failed to save match to Firestore.",
            error
        );

        return false;

    }

}


/*
=====================================================
SAVE
=====================================================
*/

async function saveMatch() {

    if (!App.currentMatch) {
        return false;
    }

    // =====================================================
    // LOCAL STORAGE
    // =====================================================

    try {

        localStorage.setItem(
            STORAGE_KEYS.currentMatch,
            JSON.stringify(
                App.currentMatch
            )
        );

    } catch (error) {

        console.error(
            "Failed to save match locally.",
            error
        );

        return false;
    }


    // =====================================================
    // FIRESTORE BACKUP
    // =====================================================

    if (
        window.MatchIQDatabase &&
        window.MatchIQDatabase.saveMatch
    ) {

        try {

            const saved =
                await window.MatchIQDatabase.saveMatch(
                    App.currentMatch
                );

            if (!saved) {

                console.warn(
                    "Match saved locally, but Firestore save failed."
                );

            }

        } catch (error) {

            console.error(
                "Firestore match save failed:",
                error
            );

            // Do NOT fail the local save
        }

    } else {

        console.warn(
            "Firestore database API not available. Match saved locally only."
        );

    }


    return true;
}

// =========================================================
// SAVE MATCH TO FIRESTORE
// =========================================================

async function saveMatchToDatabase(match = App.currentMatch) {

    if (!match) {

        return false;
    }

    if (
        !window.MatchIQDatabase ||
        !window.MatchIQDatabase.saveMatch
    ) {

        console.warn(
            "MatchIQ Database is not available."
        );

        return false;
    }

    return await
        window.MatchIQDatabase.saveMatch(
            match
        );
}


/*
=====================================================
LOAD
=====================================================
*/

function loadMatch() {

    try {

        const matchJson =
            localStorage.getItem(
                STORAGE_KEYS.currentMatch
            );

        if (!matchJson) {

            return null;

        }

        const match =
            JSON.parse(
                matchJson
            );

        App.currentMatch =
            match;

        return match;

    } catch (error) {

        console.error(
            "Failed to load match.",
            error
        );

        return null;

    }

}


/*
=====================================================
CHECK
=====================================================
*/

function hasSavedMatch() {

    return (
        localStorage.getItem(
            STORAGE_KEYS.currentMatch
        ) !== null
    );

}


/*
=====================================================
CLEAR
=====================================================
*/

function clearMatchStorage() {

    localStorage.removeItem(
        STORAGE_KEYS.currentMatch
    );

}


/*
=====================================================
DELETE CURRENT MATCH
=====================================================
*/

function deleteCurrentMatch() {

    App.currentMatch =
        null;

    clearMatchStorage();

}


/*
=====================================================
RECOVER MATCH
=====================================================
*/

function recoverSavedMatch() {

    if (!hasSavedMatch()) {

        return null;

    }

    return loadMatch();

}


/*
=====================================================
DEBUG
=====================================================
*/

function storageInfo() {

    const match =
        recoverSavedMatch();

    return {

        hasMatch:
            match !== null,

        matchId:
            match
                ? match.id
                : null,

        team:
            match
                ? match.ourTeam
                : null,

        opponent:
            match
                ? match.opponent
                : null,

        eventCount:
            match
                ? match.events.length
                : 0

    };

}


/*
=====================================================
SAVE COMPLETED MATCH
=====================================================
*/

async function saveMatchToHistory(
    match
) {

    if (!match) {

        return;

    }

    /*
    Keep the existing local history.
    */

    const storageKey =
        isSoftballSport(match)
            ? "softballHistory"
            : "matchHistory";

    const history =
        JSON.parse(
            localStorage.getItem(
                storageKey
            ) || "[]"
        );

    /*
    Prevent duplicate history entries.
    */

    const existingIndex =
        history.findIndex(
            item =>
                item.id === match.id
        );

    if (
        existingIndex >= 0
    ) {

        history[
            existingIndex
        ] = match;

    } else {

        history.push(
            match
        );

    }

    localStorage.setItem(
        storageKey,
        JSON.stringify(
            history
        )
    );

    /*
    Also save completed match
    to Firestore.
    */

    await saveMatchToFirestore(
        {
            ...match,

            completedAt:
                match.completedAt ||
                new Date().toISOString()
        }
    );

}


/*
=====================================================
DELETE HISTORICAL MATCH
=====================================================
*/

async function deleteHistoricalMatch(
    matchId,
    sport = "hockey"
) {

    const storageKey =
        isSoftballSport(sport)
            ? "softballHistory"
            : "matchHistory";

    /*
    Remove locally.
    */

    const history =
        JSON.parse(
            localStorage.getItem(
                storageKey
            ) || "[]"
        );

    const filtered =
        history.filter(
            match =>
                match.id !== matchId
        );

    localStorage.setItem(
        storageKey,
        JSON.stringify(
            filtered
        )
    );

    /*
    Remove from Firestore.
    */

    const db =
        getFirestoreDatabase();

    const user =
        getFirebaseUser();

    if (!db || !user) {

        return;

    }

    try {

        const {
            doc,
            deleteDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"
        );

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

    } catch (error) {

        console.error(
            "Failed to delete Firestore match.",
            error
        );

    }

}


/*
=====================================================
GET LOCAL MATCH HISTORY
=====================================================
*/

function getMatchHistory(
    sport = "hockey"
) {

    const storageKey =
        isSoftballSport(sport)
            ? "softballHistory"
            : "matchHistory";

    return JSON.parse(
        localStorage.getItem(
            storageKey
        ) || "[]"
    );

}


/*
=====================================================
GET LOCAL HISTORICAL MATCH
=====================================================
*/

function getHistoricalMatch(
    matchId,
    sport = "hockey"
) {

    return getMatchHistory(
        sport
    ).find(
        match =>
            match.id === matchId
    );

}


/*
=====================================================
DEFAULT COMPETITION
=====================================================
*/

function saveDefaultCompetition(
    competition
) {

    localStorage.setItem(
        "defaultCompetition",
        competition || ""
    );

}


function getDefaultCompetition() {

    return localStorage.getItem(
        "defaultCompetition"
    ) || "";

}
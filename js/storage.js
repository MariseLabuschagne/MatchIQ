
/*
=========================================================
MatchIQ
storage.js
Version: 0.9.7
Persistence Layer
=========================================================
*/

const STORAGE_KEYS = {

    currentMatch:
        "matchiq-current-match"

};

/*
=========================================================
SAVE
=========================================================
*/

function saveMatch() {

    if (!App.currentMatch) {

        return false;

    }

    try {

        localStorage.setItem(
            STORAGE_KEYS.currentMatch,
            JSON.stringify(
                App.currentMatch
            )
        );

        return true;

    } catch (error) {

        console.error(
            "Failed to save match.",
            error
        );

        return false;

    }

}

/*
=========================================================
LOAD
=========================================================
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
=========================================================
CHECK
=========================================================
*/

function hasSavedMatch() {

    return (
        localStorage.getItem(
            STORAGE_KEYS.currentMatch
        ) !== null
    );

}

/*
=========================================================
CLEAR
=========================================================
*/

function clearMatchStorage() {

    localStorage.removeItem(
        STORAGE_KEYS.currentMatch
    );

}

/*
=========================================================
DELETE CURRENT MATCH
=========================================================
*/

function deleteCurrentMatch() {

    App.currentMatch = null;

    clearMatchStorage();

}

/*
=========================================================
RECOVER MATCH
=========================================================
*/

function recoverSavedMatch() {

    if (!hasSavedMatch()) {

        return null;

    }

    return loadMatch();

}

/*
=========================================================
DEBUG
=========================================================
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


function saveMatchToHistory(
    match
) {

    const history =
        JSON.parse(
            localStorage.getItem(
                "matchHistory"
            ) || "[]"
        );

    history.push(
        match
    );

    localStorage.setItem(
        "matchHistory",
        JSON.stringify(
            history
        )
    );

}

function deleteHistoricalMatch(
    matchId
) {

    const history =
        JSON.parse(
            localStorage.getItem(
                "matchHistory"
            ) || "[]"
        );

    const filtered =
        history.filter(
            match =>
                match.id !== matchId
        );

    localStorage.setItem(
        "matchHistory",
        JSON.stringify(
            filtered
        )
    );

}


function getMatchHistory() {

    return JSON.parse(
        localStorage.getItem(
            "matchHistory"
        ) || "[]"
    );

}

function getHistoricalMatch(
    matchId
) {

    return getMatchHistory()
        .find(
            match =>
                match.id ===
                matchId
        );

}

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

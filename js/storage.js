
/*
=========================================================
MatchIQ
storage.js
Version: 2.0.2
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

    history.push(
        match
    );

    localStorage.setItem(
        storageKey,
        JSON.stringify(
            history
        )
    );
}

function deleteHistoricalMatch(
    matchId,
    sport = "hockey"
) {

    const storageKey =
        isSoftballSport(sport)
            ? "softballHistory"
            : "matchHistory";

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

}
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

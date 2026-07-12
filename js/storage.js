/*
=========================================================
MatchIQ
File: storage.js
Version: 1.0.0
Persistence Layer
=========================================================
*/

const STORAGE_KEY = "matchiq-current-match";

function saveMatch() {

    if (!App.currentMatch) return;

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(App.currentMatch)
    );

}

function loadMatch() {

    const json =
        localStorage.getItem(STORAGE_KEY);

    if (!json) return null;

    try {

        App.currentMatch =
            JSON.parse(json);

        return App.currentMatch;

    } catch (error) {

        console.error(error);

        return null;

    }

}

function clearMatchStorage() {

    localStorage.removeItem(STORAGE_KEY);

}
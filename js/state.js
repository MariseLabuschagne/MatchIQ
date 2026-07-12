/*
=========================================================
MatchIQ
File: state.js
Version: 1.0.0
Global application state.
=========================================================
*/

const App = {

    currentMatch: null,

    activeTeam: "our",

    timer: {
        running: false,
        seconds: 0,
        interval: null
    },

    settings: {
        sport: "hockey"
    }

};
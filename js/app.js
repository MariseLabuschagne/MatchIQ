/*
=====================================================
MatchIQ
app.js
Version: 0.3.0
=====================================================
*/

document.addEventListener("DOMContentLoaded", initialiseApp);

function initialiseApp() {

    console.log("🏑 MatchIQ v0.3.0");

    const startButton = document.getElementById("startMatchButton");

    startButton.addEventListener("click", startMatch);

}

function startMatch() {

    const competition =
        document.getElementById("competition").value.trim();

    const ourTeam =
        document.getElementById("ourTeam").value.trim();

    const opponent =
        document.getElementById("opponent").value.trim();

    if (ourTeam === "") {

        alert("Please enter Our Team.");

        return;

    }

    if (opponent === "") {

        alert("Please enter an Opponent.");

        return;

    }

    const venue =
        document.querySelector(
            "input[name='venue']:checked"
        ).value;

    const format =
        document.querySelector(
            "input[name='format']:checked"
        ).value;

    const periodLength =
        Number(
            document.getElementById(
                "periodLength"
            ).value
        );

    App.currentMatch = {

        id: crypto.randomUUID(),

        createdAt: new Date().toISOString(),

        competition,

        ourTeam,

        opponent,

        venue,

        format,

        periodLength,

        period:
            format === "2"
                ? "H1"
                : "Q1",

        events: []

    };

    saveMatch();

    renderLiveMatch();

    resetTimer();

    startTimer();

}
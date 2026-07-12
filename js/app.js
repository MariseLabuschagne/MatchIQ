
/*
=========================================================
MatchIQ
app.js
Version: 0.3.2
=========================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    initialiseApp
);

/*
=========================================================
APPLICATION STARTUP
=========================================================
*/

function initialiseApp() {

    console.log(
        `🏑 ${MatchIQ.app.name} v${MatchIQ.app.version}`
    );

    App.app.loaded = true;

    const startButton =
        document.getElementById(
            "startMatchButton"
        );

    if (startButton) {

        startButton.addEventListener(
            "click",
            startMatch
        );

    }

    recoverExistingMatch();
}

/*
=========================================================
MATCH RECOVERY
=========================================================
*/

function recoverExistingMatch() {

    const savedMatch =
        recoverSavedMatch();

    if (!savedMatch) {

        return;

    }

    const restore =
        confirm(

`Resume previous match?

${savedMatch.ourTeam}
vs
${savedMatch.opponent}

Events Captured:
${savedMatch.events.length}`

        );

    if (!restore) {

        deleteCurrentMatch();

        return;

    }

    App.currentMatch =
        savedMatch;

    restoreMatchClock();

    renderLiveMatch();

    updateScoreboard();

    renderTimeline();

    updateTimerDisplay();
}

/*
=========================================================
MATCH CREATION
=========================================================
*/

function startMatch() {

    const competition =
        document
            .getElementById(
                "competition"
            )
            .value
            .trim();

    const ourTeam =
        document
            .getElementById(
                "ourTeam"
            )
            .value
            .trim();

    const opponent =
        document
            .getElementById(
                "opponent"
            )
            .value
            .trim();

    if (
        !validateMatchSetup(
            ourTeam,
            opponent
        )
    ) {

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
            document
                .getElementById(
                    "periodLength"
                )
                .value
        );

    App.currentMatch =
        createMatchObject({

            competition,
            ourTeam,
            opponent,
            venue,
            format,
            periodLength

        });

    saveMatch();

    resetTimer();

    renderLiveMatch();

    startTimer();
}

/*
=========================================================
MATCH OBJECT
=========================================================
*/

function createMatchObject(
    data
) {

    return {

        id:
            crypto.randomUUID(),

        createdAt:
            new Date().toISOString(),

        completedAt:
            null,

        competition:
            data.competition,

        ourTeam:
            data.ourTeam,

        opponent:
            data.opponent,

        venue:
            data.venue,

        format:
            data.format,

        periodLength:
            data.periodLength,

        period:
            data.format === "2"
                ? "H1"
                : "Q1",

        sport:
            "hockey",

        elapsedSeconds: 0,

        events: []

    };
}

/*
=========================================================
VALIDATION
=========================================================
*/

function validateMatchSetup(
    ourTeam,
    opponent
) {

    if (ourTeam === "") {

        alert(
            "Please enter Our Team."
        );

        return false;
    }

    if (opponent === "") {

        alert(
            "Please enter an Opponent."
        );

        return false;
    }

    return true;
}

/*
=========================================================
MATCH COMPLETION
=========================================================
*/

function completeMatch() {

    if (!App.currentMatch) {

        return;
    }

    App.currentMatch.completedAt =
        new Date().toISOString();

    saveMatch();
}

/*
=========================================================
NEW MATCH
=========================================================
*/

function startNewMatch() {

    if (
        App.timer.running
    ) {

        pauseTimer();

    }

    resetTimer();

    deleteCurrentMatch();

    location.reload();
}

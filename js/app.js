
/*
=========================================================
MatchIQ
app.js
Version: 2.0.2
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

    App.app.loaded = true;

    
    App.selectedSport =
        null;


    const startButton =
        document.getElementById(
            "startMatchButton"
        );

    if (startButton) {

        startButton.addEventListener(
            "click",
            startMatch
        );
    
    const savedTeam =
        localStorage.getItem(
            "defaultTeam"
        );

    if (
        savedTeam
    ) {

        const teamInput =
            document.getElementById(
                "ourTeam"
            );

        if (
            teamInput
        ) {

            teamInput.value =
                savedTeam;

        }

    }

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

    localStorage.setItem(
        "defaultTeam",
        ourTeam
    );
    
    localStorage.setItem(
        "defaultCompetition",
        competition
    );

    const savedCompetition =
        localStorage.getItem(
            "defaultCompetition"
        );

    if (
        savedCompetition
    ) {

    const competitionInput =
        document.getElementById(
            "competition"
        );

    if (
        competitionInput
    ) {

        competitionInput.value =
            savedCompetition;

    }

}

    const venue =
        document.querySelector(
            "input[name='venue']:checked"
        ).value;

    let format = "4";
    let periodLength = 16;

    if (
        App.selectedSport !==
        "softball"
    ) {
        format =
            document.querySelector(
                "input[name='format']:checked"
            ).value;

        periodLength =
            Number(
                document.getElementById(
                    "periodLength"
                ).value
            );
    }
    let currentSide =
        "ourBatting";

    if (
        App.selectedSport ===
        "softball"
    ) {

        currentSide =
            document.querySelector(
                "input[name='batFirst']:checked"
            )?.value ||
            "ourBatting";

    }

    App.currentMatch =
        createMatchObject({

            competition,
            ourTeam,
            opponent,
            venue,
            format,
            periodLength,
            currentSide

        });

    App.currentAttack = null;

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
            App.selectedSport || "hockey",

        elapsedSeconds: 0,

        events: [],

        attackCounter: 0,

        activeAttackId: null,

        // Softball
        inning: 1,
        strikes: 0,
        balls: 0,
        outs: 0,

        bases: {

            first: null,
            second: null,
            third: null

        },
        battingOrder: {

            ourTeam: 1,
            opponent: 1

        },

        currentBatter: {

            ourTeam: 1,
            opponent: 1

        },
        currentSide:
            data.currentSide ||
            "ourBatting",

        pitchers: {

            ourTeam: {

                active: 1,

                pitcher1: {

                    name:
                        document.getElementById(
                            "ourPitcher1"
                        )?.value || "",

                    balls: 0,
                    strikes: 0,
                    walks: 0,
                    strikeouts: 0,
                    outs: 0,
                    runsAllowed: 0

                },

                pitcher2: {

                    name:
                        document.getElementById(
                            "ourPitcher2"
                        )?.value || "",

                    balls: 0,
                    strikes: 0,
                    walks: 0,
                    strikeouts: 0,
                    outs: 0,
                    runsAllowed: 0

                }

            },

            opponent: {

                active: 1,

                pitcher1: {
                    name:
                        document.getElementById(
                            "oppPitcher1"
                        )?.value || ""
                },

                pitcher2: {
                    name:
                        document.getElementById(
                            "oppPitcher2"
                        )?.value || ""
                }

            }

        }

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
    
    saveMatchToHistory(
        App.currentMatch
    );

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
    App.currentAttack = null;
    
    const savedTeam =
        localStorage.getItem(
            "defaultTeam"
        );
        
    const savedCompetition =
        localStorage.getItem(
            "defaultCompetition"
        );

    const teamInput =
        document.getElementById(
            "ourTeam"
        );
    
    const competitionInput =
        document.getElementById(
            "competition"
        );


    if (
        teamInput &&
        savedTeam
    ) {

        teamInput.value =
            savedTeam;

    }
    
    if (
        competitionInput &&
        savedCompetition
    ) {

        competitionInput.value =
            savedCompetition;

    }

    document
        .getElementById(
            "liveMatchScreen"
        )
        .innerHTML = "";

        document
            .getElementById(
                "homeScreen"
            )
            .classList.add(
                "hidden"
            );

        document
            .getElementById(
                "setupScreen"
            )
            .classList.remove(
                "hidden"
            );


    const header =
        document.getElementById(
            "appHeader"
        );

    if (header) {

        header.classList.remove(
            "hidden"
        );

    }

}


function selectSport(
    sport
) {

    App.selectedSport =
        sport;

    const formatGroup =
        document.getElementById(
            "matchFormatGroup"
        );

    const periodGroup =
        document.getElementById(
            "periodLengthGroup"
        );

    const battingGroup =
        document.getElementById(
            "battingTeamGroup"
        );
    
    const pitcherGroup =
        document.getElementById(
            "pitcherGroup"
        );
            
    if (sport === "softball") {

        if (battingGroup) {
            battingGroup.style.display =
                "block";
        }

        if (formatGroup) {
            formatGroup.style.display =
                "none";
        }

        if (periodGroup) {
            periodGroup.style.display =
                "none";
        }

        if (pitcherGroup) {
            pitcherGroup.style.display =
                "block";

        }

    } else {

        if (formatGroup) {
            formatGroup.style.display =
                "block";
        }

        if (periodGroup) {
            periodGroup.style.display =
                "block";
        }
        if (battingGroup) {
            battingGroup.style.display =
                "none";
        }
        if (pitcherGroup) {
            pitcherGroup.style.display =
                "none";

        }


    }    

    const startButton =
        document.getElementById(
            "startMatchButton"
        );

    if (
        sport === "softball"
    ) {

        startButton.innerHTML =
            "🥎 START MATCH";

    }
    else {

        startButton.innerHTML =
            "🏑 START MATCH";

    }

    document
        .getElementById(
            "homeScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "setupScreen"
        )
        .classList.remove(
            "hidden"
        );
    
}


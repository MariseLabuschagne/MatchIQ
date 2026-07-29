
/*
=========================================================
MatchIQ
events.js
Version: 2.0.1
Event Engine
=========================================================
*/

/*
=========================================================
EVENT LOOKUP
=========================================================
*/

function getEventDefinition(eventId) {

    return MatchIQ.events.find(
        event => event.id === eventId
    );

}

/*
=========================================================
EVENT CREATION
=========================================================
*/

function createEvent(
    eventType,
    options = {}
) {

    return {

        id:
            crypto.randomUUID(),

        timestamp:
            new Date().toISOString(),

        matchSecond:
            App.timer.seconds,

        period:
            App.currentMatch.period,

        eventType:
            eventType,

        player:
            options.player || null,

        player2:
            options.player2 || null,

        outcome:
            options.outcome || null,

        value:
            options.value || null,

        notes:
            options.notes || ""

    };

}


function startAttack(
    location
) {

    App.currentMatch.attackCounter += 1;

    App.currentMatch.activeAttackId =
        App.currentMatch.attackCounter;

    recordEvent(
        "attackStart",
        {
            value:
                App.currentMatch
                    .activeAttackId
        }
    );

    recordEvent(
        location
    );

}


/*
=========================================================
EVENT RECORDING
=========================================================
*/

function recordEvent(
    eventType,
    options = {}
) {

    if (!App.currentMatch) {

        console.error(
            "No active match."
        );

        return null;

    }

    const eventDefinition =
        getEventDefinition(
            eventType
        );

    if (!eventDefinition) {

        console.error(
            "Unknown event type:",
            eventType
        );

        return null;

    }
    
    const event = {

        id:
                crypto.randomUUID(),

            timestamp:
                new Date()
                    .toISOString(),

            matchSecond:
                App.timer.seconds,

            period:
                App.currentMatch.period,

            eventType:
                eventType,
            
            scoreAtEvent:
                `${getScore().our}-${getScore().opposition}`,
            
            phase:
                getEventPhase(
                    eventType
                ),

            context:
                getCurrentContext(),

       
        attackId:
            App.currentMatch
                ? App.currentMatch.activeAttackId
                : null,

    };



    App.currentMatch.events.push(
        event
    );

    saveMatch();

    updateScoreboard();

    renderTimeline();

    return event;

}


function getEventPhase(
    eventType
) {

    const event =
        MatchIQ.events.find(
            e =>
                e.id === eventType
        );

    return event
        ? event.category
        : "system";

}


function getCurrentContext() {

    if (
        App.currentMatch.activeAttackId
    ) {

        return "Circle Entry";

    }

    return "General Play";

}


/*
=========================================================
UNDO
=========================================================
*/

function removeLastEvent() {

    if (
        !App.currentMatch ||
        App.currentMatch.events.length === 0
    ) {

        return null;

    }

    const removedEvent =
        App.currentMatch.events.pop();

    saveMatch();

    updateScoreboard();

    renderTimeline();

    console.log(
        "EVENT REMOVED",
        removedEvent
    );

    return removedEvent;

}

/*
=========================================================
EVENT ACCESS HELPERS
=========================================================
*/

function getEvents() {

    if (!App.currentMatch) {

        return [];

    }

    return App.currentMatch.events;

}

function getLastEvent() {

    if (
        !App.currentMatch ||
        App.currentMatch.events.length === 0
    ) {

        return null;

    }

    return App.currentMatch.events[
        App.currentMatch.events.length - 1
    ];

}

function clearEvents() {

    if (!App.currentMatch) {

        return;

    }

    App.currentMatch.events = [];

    saveMatch();

    updateScoreboard();

    renderTimeline();

}

/*
=========================================================
MATCH EVENT SUMMARY
=========================================================
*/

 function getEventSummary() {

    const summary = {};

    MatchIQ.events.forEach(
        event => {

            summary[event.id] =
                getEventCount(
                    event.id
                );

        }
    );

    return summary;

}

/*
=========================================================
SOFTBALL
=========================================================
*/
function recordStrike() {

    App.currentMatch.strikes++;

    recordEvent("strike");

    if (App.currentMatch.strikes >= 3) {

        App.currentMatch.outs++;

        recordEvent("out");

        App.currentMatch.strikes = 0;
        App.currentMatch.balls = 0;
    }

    saveMatch();
    updateScoreboard();
}

function recordBall() {

    App.currentMatch.balls++;

    recordEvent("ball");

    if (
    App.currentMatch.balls >= 4
) {

    const bases =
        App.currentMatch.bases;

    if (
        !bases.first
    ) {

        bases.first = true;

    }
    else if (
        !bases.second
    ) {

        bases.second = true;

    }
    else if (
        !bases.third
    ) {

        bases.third = true;

    }
    else {

        recordRun();

    }

    App.currentMatch.balls = 0;
    App.currentMatch.strikes = 0;

    recordEvent(
        "walk"
    );

    saveMatch();
    updateScoreboard();

    return;

}
}

function recordOut() {

    App.currentMatch.outs++;

    recordEvent("out");

    if (
        App.currentMatch.outs >= 3
    ) {

        switchSides();

    }

    saveMatch();

    updateScoreboard();

}

function advanceInning() {

    App.currentMatch.inning++;

    App.currentMatch.strikes = 0;
    App.currentMatch.balls = 0;
    App.currentMatch.outs = 0;

    recordEvent("nextInning");

    saveMatch();
    updateScoreboard();
}
function switchSides() {

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        App.currentMatch.currentSide =
            "opponentBatting";

    }
    else {

        App.currentMatch.currentSide =
            "ourBatting";

        App.currentMatch.inning++;

    }

    App.currentMatch.balls = 0;
    App.currentMatch.strikes = 0;
    App.currentMatch.outs = 0;

    saveMatch();
    updateScoreboard();

}
function recordRun() {

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        recordEvent(
            "runFor"
        );

    }
    else {

        recordEvent(
            "runAgainst"
        );

    }

    saveMatch();

    updateScoreboard();

}

function nextBatter() {

    App.currentMatch.currentBatter++;

    if (
        App.currentMatch.currentBatter > 9
    ) {

        App.currentMatch.currentBatter = 1;

    }

    saveMatch();

    renderLiveMatch();

}
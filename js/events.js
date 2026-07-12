
/*
=========================================================
MatchIQ
File: events.js
Version: 0.3.0
Event Engine
=========================================================
*/

function createEvent(eventType,options = {}) {

    return {

       id: crypto.randomUUID(),

       timestamp: new Date().toISOString(),

        matchSecond: App.timer.seconds,

        period: App.currentMatch.period,

        eventType: eventType,

        outcome: options.outcome || null,

        player: options.player || null,

        player2: options.player2 || null,

        value: options.value || null,

        notes: options.notes || ""

    };

}

function recordEvent(eventType, options = {}) {

    const event =
        createEvent(
            eventType,
            options
        );

    App.currentMatch.events.push(
        event
    );

    saveMatch();

    updateScoreboard();

    renderTimeline();

    console.log(
        "EVENT RECORDED",
        event
    );

    return event;

}

/*
=========================================================
UNDO
=========================================================
*/

function removeLastEvent() {

   if (
        !App.currentMatch |
        App.currentMatch.events.length === 0
    ) {
        return;    }

    App.currentMatch.events.pop();

    saveMatch();

    updateScoreboard();

    renderTimeline();

}

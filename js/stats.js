
/*
=========================================================
MatchIQ
stats.js
Version: 0.3.0
=========================================================
*/

function getEventCount(eventId) {

    return App.currentMatch.events.filter(
        e => e.eventType === eventId
    ).length;

}

function getScore() {

    return {

        our:
            getEventCount(
                "goalScored"
            ),

        opposition:
            getEventCount(
                "goalConceded"
            )

    };

}

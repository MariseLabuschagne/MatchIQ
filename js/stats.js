
/*
=========================================================
MatchIQ
stats.js
Version: 0.3.0
=========================================================
*/

function getEventCount(eventId) {

    if (
        !App.currentMatch ||
        !App.currentMatch.events
    ) {
        return 0;
    }

    return App.currentMatch.events.filter(
        event =>
            event.eventType === eventId
    ).length;
}

/*
=========================================================
SCORE
=========================================================
*/

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

/*
=========================================================
ATTACK STATS
=========================================================
*/

function getAttackStats() {

    return {

        goalsScored:
            getEventCount(
                "goalScored"
            ),

        penaltyCornersWon:
            getEventCount(
                "pcWon"
            ),

        penaltyStrokesWon:
            getEventCount(
                "psWon"
            )

    };
}

/*
=========================================================
DEFENCE STATS
=========================================================
*/

function getDefenceStats() {

    return {

        goalsConceded:
            getEventCount(
                "goalConceded"
            ),

        goalkeeperSaves:
            getEventCount(
                "save"
            ),

        interceptions:
            getEventCount(
                "interception"
            ),

        turnoversWon:
            getEventCount(
                "turnoverWon"
            ),

        turnoversLost:
            getEventCount(
                "turnoverLost"
            ),

        penaltyCornersConceded:
            getEventCount(
                "pcConceded"
            ),

        penaltyStrokesConceded:
            getEventCount(
                "psConceded"
            )

    };
}

/*
=========================================================
DISCIPLINE STATS
=========================================================
*/

function getDisciplineStats() {

    return {

        greenCards:
            getEventCount(
                "greenCard"
            ),

        yellowCards:
            getEventCount(
                "yellowCard"
            ),

        redCards:
            getEventCount(
                "redCard"
            )

    };
}

/*
=========================================================
FULL MATCH SUMMARY
=========================================================
*/

function getMatchStatistics() {

    return {

        score:
            getScore(),

        attack:
            getAttackStats(),

        defence:
            getDefenceStats(),

        discipline:
            getDisciplineStats(),

        totalEvents:
            App.currentMatch
                ? App.currentMatch.events.length
                : 0

    };
}

/*
=========================================================
HELPERS
=========================================================
*/

function getTotalCards() {

    const discipline =
        getDisciplineStats();

    return (
        discipline.greenCards +
        discipline.yellowCards +
        discipline.redCards
    );
}

function getTotalPenaltyCorners() {

    const attack =
        getAttackStats();

    const defence =
        getDefenceStats();

    return {

        won:
            attack.penaltyCornersWon,

        conceded:
            defence.penaltyCornersConceded

    };
}

function getTurnoverDifferential() {

    const defence =
        getDefenceStats();

    return (
        defence.turnoversWon -
        defence.turnoversLost
    );
}
``

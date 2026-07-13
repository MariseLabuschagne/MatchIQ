
/*
=========================================================
MatchIQ
stats.js
Version: 0.6.0
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

        circleEntries:
            getEventCount(
                "circleEntry"
            ),

        shots:
            getEventCount(
                "shot"
            ),

        shotsOnTarget:
            getEventCount(
                "shotOnTarget"
            ),

        shotsOffTarget:
            getEventCount(
                "shotOffTarget"
            ),

        shotsBlocked:
            getEventCount(
                "shotBlocked"
            ),

        penaltyCornersWon:
            getEventCount(
                "pcWon"
            ),

        penaltyStrokesWon:
            getEventCount(
                "psWon"
            ),

        highTurnoversWon:
            getEventCount(
                "highTurnoverWon"
            ),

        pcGoals:
            getEventCount(
                "pcGoal"
            ),

        pcSaved:
            getEventCount(
                "pcSaved"
            ),

        pcMissed:
            getEventCount(
                "pcMissed"
            ),

        pcBrokenDown:
            getEventCount(
                "pcBrokenDown"
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
            ),

        pcConcededLow:
            getEventCount(
                "pcConcededLow"
            ),

        pcConcededHigh:
            getEventCount(
                "pcConcededHigh"
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
ATTACKING EFFECTIVENESS
=========================================================
*/

function getAttackingEffectiveness() {

    const attack =
        getAttackStats();

    return {

        entryToShotConversion:
            calculatePercentage(
                attack.shots,
                attack.circleEntries
            ),

        shotToGoalConversion:
            calculatePercentage(
                attack.goalsScored,
                attack.shots
            ),

        entryToGoalConversion:
            calculatePercentage(
                attack.goalsScored,
                attack.circleEntries
            ),

        shotAccuracy:
            calculatePercentage(
                attack.shotsOnTarget,
                attack.shots
            ),

        pcConversion:
            calculatePercentage(
                attack.pcGoals,
                attack.penaltyCornersWon
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

        effectiveness:
            getAttackingEffectiveness(),

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

function calculatePercentage(
    numerator,
    denominator
) {

    if (
        denominator === 0
    ) {

        return 0;

    }

    return Number(

        (
            numerator /
            denominator *
            100
        ).toFixed(1)

    );

}

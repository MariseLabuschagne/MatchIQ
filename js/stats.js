
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
                "entryLeft"
            )

            +

            getEventCount(
                "entryTopD"
            )

            +

            getEventCount(
                "entryRight"
            ),

        shots:

            getEventCount(
                "shotOnTarget"
            )

            +

            getEventCount(
                "shotOffTarget"
            )

            +

            getEventCount(
                "shotBlocked"
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
                "entryPenaltyCorner"
            ),

        penaltyStrokesWon:
            getEventCount(
                "psWon"
            ),

        
        turnoversAttacking25:
            getEventCount(
                "turnoverAttacking25"
            ),

        turnoversMidfield:
            getEventCount(
                "turnoverMidfield"
            ),

        turnoversDefensive25:
            getEventCount(
                "turnoverDefensive25"
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
            ),

        
        entryLeft:
            getEventCount(
                "entryLeft"
            ),

        entryTopD:
            getEventCount(
                "entryTopD"
            ),

        entryRight:
            getEventCount(
                "entryRight"
            ),
            

        entryLongCorners:

            getEventCount(
                "entryLongCorner"
            ),

        entryTurnoversLost:

            getEventCount(
                "entryTurnoverLost"
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

    const attacksWithShots =
        getAttacksWithShots();

    const attacksWithGoals =
        getAttacksWithGoals();

    return {

        entryToShotConversion:

            calculatePercentage(
                attacksWithShots,
                attack.circleEntries
            ),

        shotToGoalConversion:

            calculatePercentage(
                attack.goalsScored,
                attack.shots
            ),

        entryToGoalConversion:

            calculatePercentage(
                attacksWithGoals,
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


function getAttackJourneys() {

    if (
        !App.currentMatch
    ) {

        return [];

    }

    const attacks = {};

    App.currentMatch.events
        .forEach(event => {

            if (
                !event.attackId
            ) {

                return;

            }

            if (
                !attacks[
                    event.attackId
                ]
            ) {

                attacks[
                    event.attackId
                ] = [];

            }

            attacks[
                event.attackId
            ].push(
                event
            );

        });

    return Object.values(
        attacks
    );

}


function getAttacksWithShots() {

    return getAttackJourneys()
        .filter(
            attack =>

                attack.some(
                    event =>

                        event.eventType ===
                            "shotOnTarget"

                        ||

                        event.eventType ===
                            "shotOffTarget"

                        ||

                        event.eventType ===
                            "shotBlocked"
                )
        )
        .length;

}

function getAttacksWithGoals() {

    return getAttackJourneys()
        .filter(
            attack =>

                attack.some(
                    event =>

                        event.eventType ===
                            "goalScored"
                )
        )
        .length;

}


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

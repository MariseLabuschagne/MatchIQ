
/*
=========================================================
MatchIQ
ui.js
Version: 0.9.9
=========================================================
*/

function renderLiveMatch() {

    hideAllScreens();

    const setupScreen =
        document.getElementById(
            "setupScreen"
        );

    const liveScreen =
        document.getElementById(
            "liveMatchScreen"
        );
    
    const header =
        document.getElementById(
            "appHeader"
        );

    if (header) {

        header.classList.add(
            "hidden"
        );

    }

    setupScreen.classList.add(
        "hidden"
    );

    liveScreen.classList.remove(
        "hidden"
    );

    liveScreen.innerHTML = `

        <div class="card sticky-scoreboard">
            <div class="score-row">

                <div class="score-team">
                    ${App.currentMatch.ourTeam}
                </div>

                <div
                    id="scoreDisplay"
                    class="score"
                >
                    0 - 0
                </div>

                <div class="score-team">
                    ${App.currentMatch.opponent}
                </div>

            </div>
        
            
            <div class="timer-pill">

                <div
                    id="timerDisplay"
                    class="timer"
                >
                    00:00
                </div>

                <div
                    id="periodDisplay"
                    class="period-label"
                >
                    ${getPeriodLabel(
                        App.currentMatch.period
                    )}
                </div>

            </div>              

        </div>
        
        <div class="card match-controls">

            <button
                id="pauseButton"
                class="control-button"
            >
                ⏸ Pause
            </button>

            <button
                id="resetButton"
                class="control-button"
            >
                Reset
            </button>

            <button
                id="nextPeriodButton"
                class="period-button"
            >
                ⏭ Next Period
            </button>

            <button
                id="endMatchButton"
                class="end-button"
            >
                End Match
            </button>

        </div>

        <div class="card">

            <div id="eventSections"></div>

        </div>

        <div class="card">

            <div class="timeline-header">

                <h2>
                    Timeline
                </h2>

                <div
                    style="
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        id="exportButton"
                        class="control-button"
                    >
                        ⬇ Export Match
                    </button>

                    <button
                        id="undoButton"
                        class="undo-button"
                    >
                        ↩ Undo Last Event
                    </button>

                </div>

            </div>

            <div id="timeline"></div>

        </div>

    `;

    document
        .getElementById("pauseButton")
        .addEventListener(
            "click",
            toggleTimer
        );

    document
        .getElementById("resetButton")
        .addEventListener(
            "click",
            resetTimer
        );

    document
        .getElementById("nextPeriodButton")
        .addEventListener(
            "click",
            advancePeriod
        );

    document
        .getElementById("undoButton")
        .addEventListener(
            "click",
            undoLastEvent
        );

    document
        .getElementById("exportButton")
        .addEventListener(
            "click",
            exportMatch
        );

    document
        .getElementById("endMatchButton")
        .addEventListener(
            "click",
            endMatch
        );

    renderEventSections();

    updateScoreboard();

    updateTimerDisplay();

    renderTimeline();
}

function renderEventSections() {

    const container =
        document.getElementById(
            "eventSections"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    MatchIQ.categories.forEach(
        category => {

            const heading =
                document.createElement(
                    "h2"
                );

            heading.className =
                `event-category ${category.id}`;

            heading.textContent =
                category.name;

            container.appendChild(
                heading
            );

            const grid =
                document.createElement(
                    "div"
                );

            grid.className =
                "event-grid";

            MatchIQ.events
                .filter(
                    event =>
                        event.category ===
                        category.id
                )
                .forEach(event => {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.className =
                        `event-button ${event.category}`;

                    button.innerHTML =
                        `${event.icon}<br>${event.name}`;

                    
                    button.addEventListener(
                        "click",
                        () => {

                                                                                    
                            if (
                                event.id === "attackStart"
                            ) {

                                showCircleEntryLocationOptions();

                                return;

                            }
                            
                            if (
                                event.id === "defenceEntry"
                            ) {
                                showDefenceEntryLocationOptions();
                                return;
                            }

                            if (
                                event.id === "shot"
                            ) {

                                showShotOutcomeOptions();

                                return;

                            }

                            if (
                                event.id === "pcWon"
                            ) {

                                showPenaltyCornerOutcomeOptions();

                                return;

                            }

                            
                            if (
                                event.id === "pcConceded"
                            ) {

                                showPenaltyCornerConcededOptions();

                                return;

                            }

                            recordEvent(
                                event.id
                            );

                        }
                    );


                    grid.appendChild(
                        button
                    );

                });

            container.appendChild(
                grid
            );

        }
    );
}

function updateScoreboard() {

    const scoreDisplay =
        document.getElementById(
            "scoreDisplay"
        );

    if (!scoreDisplay) {
        return;
    }

    const score =
        getScore();

    scoreDisplay.textContent =
        `${score.our} - ${score.opposition}`;
}


function getPeriodLabel(
    period
) {

    switch (period) {

        case "H1":
            return "First Half";

        case "H2":
            return "Second Half";

        case "Q1":
            return "First Quarter";

        case "Q2":
            return "Second Quarter";

        case "Q3":
            return "Third Quarter";

        case "Q4":
            return "Fourth Quarter";

        default:
            return period;

    }

}


function renderTimeline() {

    const timeline =
        document.getElementById(
            "timeline"
        );

    if (!timeline) {
        return;
    }

    if (
        !App.currentMatch ||
        App.currentMatch.events.length === 0
    ) {

        timeline.innerHTML = `
            <div class="timeline-empty">
                No events captured yet.
            </div>
        `;

        return;
    }

    timeline.innerHTML = "";

    App.currentMatch.events
        .slice()
        .reverse()
        .forEach(event => {

            const config =
                MatchIQ.events.find(
                    e =>
                        e.id ===
                        event.eventType
                );

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "timeline-row";

            row.innerHTML = `
                <div class="timeline-time">
                    ${formatTime(
                        event.matchSecond
                    )}
                </div>

                <div class="timeline-event">
                    ${getTimelineText(
                        config,
                        event
                    )}
                </div>
            `;

            timeline.appendChild(
                row
            );

        });
}

function getTimelineText(
    config,
    event
) {

    if (
        event.eventType ===
        "periodChanged"
    ) {

        return `
            ⏭ Period Changed: ${event.value}
        `;

    }

    return `
        ${config?.icon || "🏑"}
        ${config?.name || event.eventType}
    `;
}

function advancePeriod() {

    if (!App.currentMatch) {
        return;
    }

    const nextPeriod =
        getNextPeriod();

    if (!nextPeriod) {

        alert(
            "Final period already reached."
        );

        return;
    }

    App.currentMatch.period =
        nextPeriod;

    recordEvent(
        "periodChanged",
        {
            value: nextPeriod
        }
    );

    saveMatch();

    updatePeriodDisplay();

    alert(
        `Period advanced to ${nextPeriod}`
    );
}

function getNextPeriod() {

    const current =
        App.currentMatch.period;

    if (
        App.currentMatch.format === "2"
    ) {

        if (current === "H1") {
            return "H2";
        }

        return null;
    }

    if (
        App.currentMatch.format === "4"
    ) {

        if (current === "Q1") return "Q2";
        if (current === "Q2") return "Q3";
        if (current === "Q3") return "Q4";

        return null;
    }

    return null;
}

function updatePeriodDisplay() {

    const periodDisplay =
        document.getElementById(
            "periodDisplay"
        );

    if (!periodDisplay) {
        return;
    }

    
    periodDisplay.textContent =
        getPeriodLabel(
            App.currentMatch.period
        );

}

function undoLastEvent() {

    if (
        !App.currentMatch ||
        App.currentMatch.events.length === 0
    ) {

        alert(
            "No events to undo."
        );

        return;
    }

    if (
        confirm(
            "Remove the last captured event?"
        )
    ) {

        removeLastEvent();

    }
}


function endMatch() {

    pauseTimer();

    completeMatch();

    renderMatchSummary();

}


function renderMatchSummary() {

    const liveScreen =
        document.getElementById(
            "liveMatchScreen"
        );

    const stats =
        getMatchStatistics();

    const score =
        stats.score;

    liveScreen.innerHTML = `

        <div class="summary-screen">

            <div class="card">

                <div class="summary-title">
                    🏑 Match Summary
                </div>
                
                <div class="match-summary-header">

                    <div class="match-summary-team">

                        ${App.currentMatch.ourTeam}

                    </div>

                    <div class="match-summary-score">

                        ${score.our} - ${score.opposition}

                    </div>

                    <div class="match-summary-team">

                        ${App.currentMatch.opponent}

                    </div>

                </div>


            </div>
            
            <div class="card summary-section">

                <h3>
                    Attack Journey
                </h3>

                ${renderSummaryStat(
                    "Circle Entries",
                    stats.attack.circleEntries
                )}

                ${renderSummarySubStat(
                    "Shots",
                    stats.attack.shots
                )}

                ${renderSummarySubStat(
                    "Penalty Corners",
                    stats.attack.penaltyCornersWon
                )}

                ${renderSummarySubStat(
                    "Long Corners",
                    stats.attack.entryLongCorners
                )}

                ${renderSummarySubStat(
                    "Turnovers Lost",
                    stats.attack.entryTurnoversLost
                )}

                ${renderSummaryStat(
                    "Goals",
                    stats.attack.goalsScored
                )}

            </div>



            <div class="card summary-section">

                <h3>Attack</h3>

                ${renderSummaryStat(
                    "Circle Entries",
                    stats.attack.circleEntries
                )}
                
                ${renderSummarySubStat(
                    "Left",
                    stats.attack.entryLeft
                )}

                ${renderSummarySubStat(
                    "Top D",
                    stats.attack.entryTopD
                )}

                ${renderSummarySubStat(
                    "Right",
                    stats.attack.entryRight
                )}

                ${renderSummaryStat(
                    "Shots",
                    stats.attack.shots
                )}

                ${renderSummarySubStat(
                    "On Target",
                    stats.attack.shotsOnTarget
                )}

                ${renderSummarySubStat(
                    "Off Target",
                    stats.attack.shotsOffTarget
                )}

                ${renderSummarySubStat(
                    "Blocked",
                    stats.attack.shotsBlocked
                )}

                ${renderSummaryStat(
                    "Attack Outcomes",
                    ""
                )}

                ${renderSummarySubStat(
                    "Penalty Corners",
                    stats.attack.penaltyCornersWon
                )}

                ${renderSummarySubSubStat(
                    "Converted",
                    stats.attack.pcGoals
                )}

                ${renderSummarySubSubStat(
                    "Saved",
                    stats.attack.pcSaved
                )}

                ${renderSummarySubSubStat(
                    "Missed",
                    stats.attack.pcMissed
                )}

                ${renderSummarySubSubStat(
                    "Broken Down",
                    stats.attack.pcBrokenDown
                )}

                ${renderSummarySubStat(
                    "Long Corners",
                    stats.attack.entryLongCorners
                )}
                
                ${renderSummarySubStat(
                    "Penalty Strokes",
                    stats.attack.penaltyStrokesWon
                )}


                ${renderSummarySubStat(
                    "Turnovers Lost",
                    stats.attack.entryTurnoversLost
                )}
                
                ${renderSummaryStat(
                    "Goals Scored",
                    stats.attack.goalsScored
                )}

                ${renderSummarySubStat(
                    "Field Goals",
                    stats.attack.fieldGoals
                )}

                ${renderSummarySubStat(
                    "PC Goals",
                    stats.attack.pcGoals
                )}
                
                ${renderSummaryStat(
                    "Turnovers Won",
                    ""
                )}

                ${renderSummarySubStat(
                    "Attacking 25",
                    stats.attack.turnoversAttacking25
                )}

                ${renderSummarySubStat(
                    "Midfield",
                    stats.attack.turnoversMidfield
                )}

                ${renderSummarySubStat(
                    "Defensive 25",
                    stats.attack.turnoversDefensive25
                )}                 

            </div>

            
            <div class="card summary-section">

                <h3>
                    Attacking Effectiveness
                </h3>

                ${renderSummaryStat(
                    "Entries Producing Shot %",
                    stats.effectiveness.entryToShotConversion + "%"
                )}
               
                ${renderSummaryStat(
                    "Field Goal Conversion %",
                    stats.effectiveness.fieldGoalConversion + "%"
                )}

                ${renderSummaryStat(
                    "Entry → Goal %",
                    stats.effectiveness.entryToGoalConversion + "%"
                )}

                ${renderSummaryStat(
                    "Shot Accuracy %",
                    stats.effectiveness.shotAccuracy + "%"
                )}

                ${renderSummaryStat(
                    "PC Conversion %",
                    stats.effectiveness.pcConversion + "%"
                )}

            </div>

            
            <div class="card summary-section">

                <h3>Defence</h3>

                
                ${renderSummaryStat(
                    "Circle Entries Against",
                    stats.defence.circleEntriesAgainst
                )}

                ${renderSummarySubStat(
                    "Left",
                    stats.defence.defenceEntryLeft
                )}

                ${renderSummarySubStat(
                    "Top D",
                    stats.defence.defenceEntryTopD
                )}

                ${renderSummarySubStat(
                    "Right",
                    stats.defence.defenceEntryRight
                )}

                ${renderSummaryStat(
                    "Goals Conceded",
                    stats.defence.goalsConceded
                )}

                ${renderSummaryStat(
                    "Goalkeeper Saves",
                    stats.defence.goalkeeperSaves
                )}

                ${renderSummaryStat(
                    "Turnovers Lost",
                    ""
                )}

                ${renderSummarySubStat(
                    "Attacking 25",
                    stats.defence.turnoverAttacking25Lost
                )}

                ${renderSummarySubStat(
                    "Midfield",
                    stats.defence.turnoverMidfieldLost
                )}

                ${renderSummarySubStat(
                    "Defensive 25",
                    stats.defence.turnoverDefensive25Lost
                )}

                                
                ${renderSummaryStat(
                    "Penalty Corners Conceded",
                    stats.defence.penaltyCornersConceded
                )}

                ${renderSummarySubStat(
                    "Goals",
                    stats.defence.pcGoalConceded
                )}

                ${renderSummarySubStat(
                    "First Wave Saves",
                    stats.defence.pcFirstWaveSave
                )}

                ${renderSummarySubStat(
                    "GK Saves",
                    stats.defence.pcGoalkeeperSave
                )}

                ${renderSummarySubStat(
                    "Second Wave Saves",
                    stats.defence.pcSecondWaveSave
                )}



            </div>

            <div class="card summary-section">

                <h3>Discipline</h3>

                ${renderSummaryStat(
                    "Green Cards",
                    stats.discipline.greenCards
                )}

                ${renderSummaryStat(
                    "Yellow Cards",
                    stats.discipline.yellowCards
                )}

                ${renderSummaryStat(
                    "Red Cards",
                    stats.discipline.redCards
                )}

            </div>

            <div class="card summary-section">

                <h3>Match Information</h3>

                ${renderSummaryStat(
                    "Events Recorded",
                    stats.totalEvents
                )}

                ${renderSummaryStat(
                    "Match Duration",
                    formatTime(
                        App.timer.seconds
                    )
                )}

            </div>

            <div class="card summary-section">

                <h3>
                    🏑 Coach Insights
                </h3>

                <div class="highlights">

                    ${buildHighlights()}

                </div>

            </div>


            <div class="summary-actions">

                <button
                    id="summaryExportButton"
                    class="summary-button export"
                >
                    ⬇ Export Match
                </button>

                <button
                    id="newMatchButton"
                    class="summary-button new-match"
                >
                    🏑 Hockey Home Screen
                </button>

            </div>

        </div>

    `;

    document
        .getElementById(
            "summaryExportButton"
        )
        .addEventListener(
            "click",
            exportMatch
        );

    
document
    .getElementById(
        "newMatchButton"
    )
    .addEventListener(
        "click",
        returnToHockeyHome
    );


}

function renderSummaryStat(
    label,
    value
) {

    return `

        <div class="summary-stat">

            <div>
                ${label}
            </div>

            <div class="summary-value">
                ${value}
            </div>

        </div>

    `;

}

function renderSummarySubStat(
    label,
    value
) {

    return `

        <div class="summary-stat summary-sub-stat">

            <div>
                ↳ ${label}
            </div>

            <div class="summary-value">
                ${value}
            </div>

        </div>

    `;

}


function renderSummarySubSubStat(
    label,
    value
) {

    return `

        <div class="summary-subsub-stat">

            <span>
                ↳↳ ${label}
            </span>

            <span>
                ${value}
            </span>

        </div>

    `;

}


function renderFunnelStep(
    label,
    value
) {

    return `

        <div class="funnel-step">

            <div class="funnel-value">
                ${value}
            </div>

            <div class="funnel-label">
                ${label}
            </div>

        </div>

    `;

}



function buildHighlights() {

    const insights = [];

    const attack =
        getAttackStats();

    const defence =
        getDefenceStats();
    
    const effectiveness =
        getMatchStatistics()
            .effectiveness;


    /*
    =========================================
    POSITIVE INSIGHTS
    =========================================
    */

    if (
        effectiveness.shotAccuracy >= 70
    ) {

        insights.push(
            "✅ Shot accuracy above 70%"
        );

    }

    if (
        effectiveness.entryToShotConversion >= 60
    ) {

        insights.push(
            "✅ Strong circle entry conversion into shots"
        );

    }

    if (
        defence.penaltyCornersConceded > 0
        &&
        defence.pcGoalConceded /
        defence.penaltyCornersConceded <= 0.25
    ) {

        insights.push(
            "✅ Strong defensive penalty corner unit"
        );

    }

    /*
    =========================================
    WARNING INSIGHTS
    =========================================
    */

    if (
        defence.turnoverDefensive25Lost >= 5
    ) {

        insights.push(
            "⚠ High number of turnovers in Defensive 25"
        );

    }

    if (
        defence.circleEntriesAgainst >= 10
    ) {

        insights.push(
            "⚠ Opposition achieved many circle entries"
        );

    }

    if (
        effectiveness.shotAccuracy > 0
        &&
        effectiveness.shotAccuracy < 40
    ) {

        insights.push(
            "⚠ Shot accuracy below 40%"
        );

    }

    /*
    =========================================
    TACTICAL INSIGHTS
    =========================================
    */

    const totalEntries =
        attack.entryLeft
        +
        attack.entryTopD
        +
        attack.entryRight;

    if (
        totalEntries > 0
    ) {

        const rightPct =
            Math.round(
                attack.entryRight
                /
                totalEntries
                * 100
            );

        const leftPct =
            Math.round(
                attack.entryLeft
                /
                totalEntries
                * 100
            );

        if (
            rightPct >= 60
        ) {

            insights.push(
                `📊 ${rightPct}% of entries came from the Right`
            );

        }

        if (
            leftPct >= 60
        ) {

            insights.push(
                `📊 ${leftPct}% of entries came from the Left`
            );

        }

    }

    /*
    =========================================
    DEFAULT
    =========================================
    */

    if (
        insights.length === 0
    ) {

        insights.push(
            "📊 No significant trends identified."
        );

    }

    return insights
        .map(
            item =>
                `
                <div class="insight-item">
                    ${item}
                </div>
                `
        )
        .join("");

}

function showShotOutcomeOptions() {

    removeOutcomePanel();

    const container =
        document.getElementById(
            "eventSections"
        );

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "outcomePanel";

    panel.className =
    "card outcome-panel";


    panel.innerHTML = `
        
        <h3 class="outcome-title">
                🎯 SELECT SHOT OUTCOME
            </h3>


        <div class="event-grid">

            <button
                class="event-button attack"
                onclick="recordShotOutcome('shotOnTarget')"
            >
                🎯<br>
                On Target
            </button>

            <button
                class="event-button attack"
                onclick="recordShotOutcome('shotOffTarget')"
            >
                ⚪<br>
                Off Target
            </button>

            <button
                class="event-button attack"
                onclick="recordShotOutcome('shotBlocked')"
            >
                🛑<br>
                Blocked
            </button>
                        
            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>



        </div>

    `;

    container.prepend(
        panel
    );

}

function recordShotOutcome(
    outcome
) {

    recordEvent(
        "shot"
    );

    recordEvent(
        outcome
    );

    removeOutcomePanel();

}

function showPenaltyCornerOutcomeOptions() {

    removeOutcomePanel();

    const container =
        document.getElementById(
            "eventSections"
        );

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "outcomePanel";

    
    panel.className =
    "card outcome-panel";


    panel.innerHTML = `

        
        <h3 class="outcome-title">
            ⚠️ SELECT PENALTY CORNER OUTCOME
        </h3>


        <div class="event-grid">
                    
        <button
            class="event-button attack"
            onclick="recordPenaltyCornerOutcome('pcGoal')"
        >
            🥅<br>
            Goal
        </button>

        <button
            class="event-button attack"
            onclick="recordPenaltyCornerOutcome('pcSaved')"
        >
            🧤<br>
            Saved
        </button>

        <button
            class="event-button attack"
            onclick="recordPenaltyCornerOutcome('pcMissed')"
        >
            ❌<br>
            Missed
        </button>

        <button
            class="event-button attack"
            onclick="recordPenaltyCornerOutcome('pcBrokenDown')"
        >
            ⚠️<br>
            Broken Down
        </button>
               
        <button
            class="event-button outcome-cancel"
            onclick="removeOutcomePanel()"
        >
            ✖<br>
            Cancel
        </button>



        </div>

    `;

    container.prepend(
        panel
    );

}


function showCircleEntryLocationOptions() {

    removeOutcomePanel();

    const container =
        document.getElementById(
            "eventSections"
        );

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "outcomePanel";

    panel.className =
        "card outcome-panel";

    panel.innerHTML = `

        <h3 class="outcome-title">

            ⭕

            SELECT ENTRY LOCATION

        </h3>

        <div class="event-grid">

            <button
                class="event-button attack"
                onclick="recordEntryLocation('entryLeft')"
            >
                ⬅️<br>
                Left
            </button>

            <button
                class="event-button attack"
                onclick="recordEntryLocation('entryTopD')"
            >
                ⬆️<br>
                Top D
            </button>

            <button
                class="event-button attack"
                onclick="recordEntryLocation('entryRight')"
            >
                ➡️<br>
                Right
            </button>

            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>

        </div>

    `;

    container.prepend(
        panel
    );

}

function showDefenceEntryLocationOptions() {

    removeOutcomePanel();

    const container =
        document.getElementById(
            "eventSections"
        );

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "outcomePanel";

    panel.className =
        "card outcome-panel";

    panel.innerHTML = `

        <h3 class="outcome-title">

            ⭕

            SELECT ENTRY LOCATION

        </h3>

        <div class="event-grid">

            <button
                class="event-button defence"
                onclick="recordDefenceLocation('defenceEntryLeft')"
            >
                ⬅️<br>
                Left
            </button>

            <button
                class="event-button defence"
                onclick="recordDefenceLocation('defenceEntryTopD')"
            >
                ⬆️<br>
                Top D
            </button>

            <button
                class="event-button defence"
                onclick="recordDefenceLocation('defenceEntryRight')"
            >
                ➡️<br>
                Right
            </button>

            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>

        </div>

    `;

    container.prepend(
        panel
    );

}

function recordEntryLocation(
    location
) {

    App.currentMatch.attackCounter += 1;

    App.currentMatch.activeAttackId =
        App.currentMatch.attackCounter;

    App.currentAttack = {

        id:
            App.currentMatch.activeAttackId,

        active: true,

        startedAt:
            Date.now(),

        location:
            location

    };

    recordEvent(
        "attackStart"
    );

    recordEvent(
        location
    );

    showEntryOutcomeOptions();

}


function recordDefenceLocation(
    location
) {

    recordEvent(
        location
    );

    showDefenceOutcomeOptions();

}


function showEntryOutcomeOptions() {

    const panel =
        document.getElementById(
            "outcomePanel"
        );

    if (!panel) {

        return;

    }

    panel.innerHTML = `

        <h3 class="outcome-title">

            🎯 ACTIVE ATTACK

        </h3>

        <div class="event-grid">

            <button
                class="event-button attack"
                onclick="recordAttackAction('shotOnTarget')"
            >
                🎯<br>
                Shot On Target
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackAction('shotOffTarget')"
            >
                ⚪<br>
                Shot Off Target
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackAction('shotBlocked')"
            >
                🛑<br>
                Shot Blocked
            </button>

            <button
                class="event-button attack"
                onclick="recordEntryPenaltyCorner()"
            >
                🚩<br>
                Penalty Corner
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackAction('psWon')"
            >
                🏑<br>
                Penalty Stroke
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackAction('entryLongCorner')"
            >
                ↩️<br>
                Long Corner
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackAction('goalScored')"
            >
                🥅<br>
                Goal
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackAction('entryTurnoverLost')"
            >
                ❌<br>
                Turnover Lost
            </button>

            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>

        </div>

    `;

}


function showDefenceOutcomeOptions() {

    const panel =
        document.getElementById(
            "outcomePanel"
        );

    if (!panel) {

        return;

    }

    panel.innerHTML = `

        <h3 class="outcome-title">

            🛡️ DEFENSIVE OUTCOME

        </h3>

        <div class="event-grid">

            <button
                class="event-button defence"
                onclick="recordDefenceOutcome('save')"
            >
                🧤<br>
                Goalkeeper Save
            </button>

            <button
                class="event-button defence"
                onclick="recordDefenceOutcome('goalConceded')"
            >
                🥅<br>
                Goal
            </button>

            <button
                class="event-button defence"
                onclick="showDefencePenaltyCornerOutcomeOptions()"
            >
                🚩<br>
                Penalty Corner
            </button>

            <button
                class="event-button defence"
                onclick="recordDefenceOutcome('psConceded')"
            >
                🏑<br>
                Penalty Stroke
            </button>
            
            <button
                class="event-button defence"
                onclick="recordDefenceOutcome('turnoverWonDefence')"
            >
                ✅<br>
                Turnover Won
            </button>


            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>

        </div>

    `;

}


function recordDefenceOutcome(
    outcome
) {

    recordEvent(
        outcome
    );

    if (

        outcome ===
            "goalConceded"

        ||

        outcome ===
            "turnoverWonDefence"

    ) {

        removeOutcomePanel();

    }

}

function showDefencePenaltyCornerOutcomeOptions() {

    recordEvent(
        "pcConceded"
    );

    const panel =
        document.getElementById(
            "outcomePanel"
        );

    if (!panel) {

        return;

    }

    panel.innerHTML = `

        <h3 class="outcome-title">

            🚩 DEFENSIVE PC OUTCOME

        </h3>

        <div class="event-grid">

            <button
                class="event-button defence"
                onclick="recordDefencePenaltyCornerOutcome('pcGoalConceded')"
            >
                🥅<br>
                Goal
            </button>

            <button
                class="event-button defence"
                onclick="recordDefencePenaltyCornerOutcome('pcFirstWaveSave')"
            >
                🛑<br>
                First Wave Save
            </button>

            <button
                class="event-button defence"
                onclick="recordDefencePenaltyCornerOutcome('pcGoalkeeperSave')"
            >
                🧤<br>
                GK Save
            </button>

            <button
                class="event-button defence"
                onclick="recordDefencePenaltyCornerOutcome('pcSecondWaveSave')"
            >
                ✅<br>
                Second Wave Save
            </button>
                        
            <button
                class="event-button defence"
                onclick="recordDefencePenaltyCornerOutcome('turnoverWonDefence')"
            >
                ✅<br>
                Turnover Won
            </button>

            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>

        </div>

    `;

}



function recordDefencePenaltyCornerOutcome(
    outcome
) {

    recordEvent(
        outcome
    );

    if (

        outcome ===
            "pcGoalConceded"

        ||

        outcome ===
            "pcSecondWaveSave"

        ||

        outcome ===
            "turnoverWonDefence"

    ) {

        removeOutcomePanel();

    }

}

function recordEntryOutcome(
    outcome
) {

    recordEvent(
        outcome
    );

    if (
        outcome ===
        "entryShot"
    ) {

        showAttackShotOutcomeOptions();

        return;

    }

    if (
        outcome ===
        "entryPenaltyCorner"
    ) {

        showAttackPenaltyCornerOutcomeOptions();

        return;

    }

    removeOutcomePanel();

}


function recordAttackAction(
    outcome
) {

    if (
        outcome === "goalScored"
    ) {

        const currentAttackId =
            App.currentMatch
                .activeAttackId;

        const shotAlreadyCaptured =
            App.currentMatch.events.some(
                event =>

                    event.attackId ===
                        currentAttackId

                    &&

                    event.eventType ===
                        "shotOnTarget"
            );

        if (
            !shotAlreadyCaptured
        ) {

            recordEvent(
                "shotOnTarget"
            );

        }

    }

    recordEvent(
        outcome
    );

    if (
        outcome === "goalScored"
        ||
        outcome === "entryTurnoverLost"
    ) {

        App.currentMatch.activeAttackId =
            null;

        removeOutcomePanel();

    }

}


function recordEntryPenaltyCorner() {

    recordEvent(
        "entryPenaltyCorner"
    );

    showAttackPenaltyCornerOutcomeOptions();

}


function showAttackPenaltyCornerOutcomeOptions() {

    const panel =
        document.getElementById(
            "outcomePanel"
        );

    if (!panel) {

        return;

    }

    panel.innerHTML = `

        <h3 class="outcome-title">

            🚩 PENALTY CORNER OUTCOME

        </h3>

        <div class="event-grid">

            <button
                class="event-button attack"
                onclick="recordAttackPenaltyCornerOutcome('pcGoal')"
            >
                🥅<br>
                Goal
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackPenaltyCornerOutcome('pcSaved')"
            >
                🧤<br>
                Saved
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackPenaltyCornerOutcome('pcMissed')"
            >
                ❌<br>
                Missed
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackPenaltyCornerOutcome('pcBrokenDown')"
            >
                ⚠️<br>
                Broken Down
            </button>

            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>

        </div>

    `;

}

function recordAttackPenaltyCornerOutcome(
    outcome
) {

    recordEvent(
        outcome
    );

    if (
        outcome ===
        "pcGoal"
    ) {

        recordEvent(
            "goalScored"
        );

    }

    removeOutcomePanel();

}


function recordPenaltyCornerOutcome(
    outcome
) {

    recordEvent(
        "pcWon"
    );

    recordEvent(
        outcome
    );

    if (
        outcome === "pcGoal"
    ) {

        recordEvent(
            "goalScored"
        );

    }

    removeOutcomePanel();

}


function removeOutcomePanel() {

    const panel =
        document.getElementById(
            "outcomePanel"
        );

    if (panel) {

        panel.remove();

    }

}


function showPenaltyCornerConcededOptions() {

    removeOutcomePanel();

    const container =
        document.getElementById(
            "eventSections"
        );

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "outcomePanel";

    panel.className =
        "card outcome-panel";

    panel.innerHTML = `

        <h3 class="outcome-title">
            🚩 SELECT PC TYPE
        </h3>

        <div class="event-grid">

            <button
                class="event-button defence"
                onclick="recordPCConceded('pcConcededLow')"
            >
                ⬇️<br>
                Low Flying
            </button>

            <button
                class="event-button defence"
                onclick="recordPCConceded('pcConcededHigh')"
            >
                ⬆️<br>
                High Flying
            </button>

            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>

        </div>

    `;

    container.prepend(
        panel
    );

}


function recordPCConceded(
    outcome
) {

    recordEvent(
        "pcConceded"
    );

    recordEvent(
        outcome
    );

    removeOutcomePanel();

}

function renderMatchHistory() {

    hideAllScreens();
    
    const history =
        getMatchHistory();


    document
        .getElementById(
            "homeScreen"
        )
        .classList.add(
            "hidden"
        );

    const screen =
        document.getElementById(
            "historyScreen"
        );

    screen.classList.remove(
        "hidden"
    );

    // Build page header ONCE
    screen.innerHTML = `

        <button
            class="action-button secondary-button
            
            console.log(
                "Hockey Screen button clicked"
            );

            onclick="closeMatchHistory()"
        >
            ← Hockey Screen
        </button>

        <h2>
            Match History
        </h2>

    `;

    if (
        history.length === 0
    ) {

        screen.innerHTML += `

            <p>
                No matches saved.
            </p>

        `;

        return;

    }

    history
        .slice()
        .reverse()
        .forEach(match => {

            const matchEvents =
                match.events || [];

            const ourGoals =
                matchEvents.filter(
                    e =>
                        e.eventType ===
                        "goalScored"
                ).length;

            const oppositionGoals =
                matchEvents.filter(
                    e =>
                        e.eventType ===
                        "goalConceded"
                ).length;

            const matchDate =
                (
                    match.completedAt ||
                    match.createdAt ||
                    ""
                )
                .split("T")[0];

            screen.innerHTML += `

                <div class="card">

                    <h3>

                        ${match.ourTeam}

                        vs

                        ${match.opponent}

                    </h3>

                    <h2>

                        ${ourGoals}

                        -

                        ${oppositionGoals}

                    </h2>

                    <p>

                        ${matchDate}

                    </p>

         
                    <p class="history-events">

                        Events:
                        ${matchEvents.length}

                    </p>

                    <div class="history-actions">

                        <button
                            class="action-button"
                            onclick="openHistoricalMatch('${match.id}')"
                        >
                            📂 Open
                        </button>

                        <button
                            class="action-button"
                            onclick="
                                deleteHistoricalMatch('${match.id}');
                                renderMatchHistory();
                            "
                        >
                            🗑 Delete
                        </button>

                    </div>

            `;

        });

}


function closeMatchHistory() {

    const historyScreen =
        document.getElementById(
            "historyScreen"
        );

    historyScreen.classList.add(
        "hidden"
    );

    historyScreen.innerHTML = "";

    showHockeyMenu();

}

function openHistoricalMatch(
    matchId
) {

    console.log(
        "Opening match:",
        matchId
    );

    const match =
        getHistoricalMatch(
            matchId
        );

    console.log(
        "Match found:",
        match
    );

    if (!match) {

        alert(
            "Match not found."
        );

        return;

    }

    App.currentMatch =
        structuredClone(
            match
        );

    if (!App.timer) {

        App.timer = {
            seconds: 0,
            running: false
        };

    }

    App.timer.seconds =
        match.elapsedSeconds || 0;

    document
        .getElementById(
            "historyScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "liveMatchScreen"
        )
        .classList.remove(
            "hidden"
        );

    renderMatchSummary();

}
  

function showHockeyMenu() {

    hideAllScreens();
    
    document
        .getElementById(
            "historyScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "historyScreen"
        )
        .innerHTML = "";

    document
        .getElementById(
            "setupScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "liveMatchScreen"
        )
        .classList.add(
            "hidden"
        );

    const historyScreen =
        document.getElementById(
            "historyScreen"
        );

    historyScreen.classList.add(
        "hidden"
    );

    document
        .getElementById(
            "historyScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "liveMatchScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "setupScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "homeScreen"
        )
        .classList.add(
            "hidden"
        );

    const screen =
        document.getElementById(
            "hockeyMenuScreen"
        );

    screen.classList.remove(
        "hidden"
    );

    screen.innerHTML = `

        <div class="card hockey-menu-card">

            <button
                class="action-button secondary-button"
                onclick="returnToHomeScreen()"
            >
                ← Back
            </button>

            <h1>
                🏑 Field Hockey
            </h1>

            <div class="hockey-menu-buttons">

                <button
                    class="sport-button hockey"
                    onclick="showHockeySetup()"
                >
                    ▶ New Match
                </button>

                <button
                    class="sport-button history"
                    onclick="renderMatchHistory()"
                >
                    📊 Match History
                </button>

            </div>

        </div>

    `;

}

function returnToHomeScreen() {

    hideAllScreens();

    document
        .getElementById(
            "hockeyMenuScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "homeScreen"
        )
        .classList.remove(
            "hidden"
        );

}


function showHockeySetup() {

    hideAllScreens();
    
    document
        .getElementById(
            "hockeyMenuScreen"
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
    
    
const teamInput =
    document.getElementById(
        "ourTeam"
    );

    if (teamInput) {

        teamInput.value =
            localStorage.getItem(
                "defaultTeam"
            ) || "";

    }

    const competitionInput =
        document.getElementById(
            "competition"
        );

    if (competitionInput) {

        competitionInput.value =
            localStorage.getItem(
                "defaultCompetition"
            ) || "";

    }


}


function returnToHockeyHome() {

    App.currentMatch = null;

    document
        .getElementById(
            "liveMatchScreen"
        )
        .classList.add(
            "hidden"
        );

    showHockeyMenu();

}


function hideAllScreens() {

    [
        "homeScreen",
        "setupScreen",
        "hockeyMenuScreen",
        "liveMatchScreen",
        "historyScreen"
    ].forEach(id => {

        const screen =
            document.getElementById(id);

        if (screen) {

            screen.classList.add(
                "hidden"
            );

        }

    });

}

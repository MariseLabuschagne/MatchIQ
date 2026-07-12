
/*
=========================================================
MatchIQ
ui.js
Version: 0.5.0
=========================================================
*/

function renderLiveMatch() {

    const setupScreen =
        document.getElementById(
            "setupScreen"
        );

    const liveScreen =
        document.getElementById(
            "liveMatchScreen"
        );

    setupScreen.classList.add(
        "hidden"
    );

    liveScreen.classList.remove(
        "hidden"
    );

    liveScreen.innerHTML = `

        <div class="card scoreboard">

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

            <div
                id="matchTimer"
                class="timer"
            >
                00:00
            </div>

            <div
                id="periodDisplay"
                class="period"
            >
                ${App.currentMatch.period}
            </div>

            <div class="match-controls">

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
                    🔄 Reset
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
                    ✅ End Match
                </button>

            </div>

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
        App.currentMatch.period;
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

                <div class="summary-score">
                    ${App.currentMatch.ourTeam}
                    ${score.our}
                    -
                    ${score.opposition}
                    ${App.currentMatch.opponent}
                </div>

            </div>

            <div class="card summary-section">

                <h3>Attack</h3>

                ${renderSummaryStat(
                    "Goals Scored",
                    stats.attack.goalsScored
                )}

                ${renderSummaryStat(
                    "Penalty Corners Won",
                    stats.attack.penaltyCornersWon
                )}

                ${renderSummaryStat(
                    "Penalty Strokes Won",
                    stats.attack.penaltyStrokesWon
                )}

            </div>

            
            <div class="card summary-section">

                <h3>Defence</h3>

                ${renderSummaryStat(
                    "Goals Conceded",
                    stats.defence.goalsConceded
                )}

                ${renderSummaryStat(
                    "Goalkeeper Saves",
                    stats.defence.goalkeeperSaves
                )}

                ${renderSummaryStat(
                    "Interceptions",
                    stats.defence.interceptions
                )}

                ${renderSummaryStat(
                    "Turnovers Won",
                    stats.defence.turnoversWon
                )}

                ${renderSummaryStat(
                    "Turnovers Lost",
                    stats.defence.turnoversLost
                )}

                ${renderSummaryStat(
                    "Penalty Corners Conceded",
                    stats.defence.penaltyCornersConceded
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

                <h3>Highlights</h3>

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
                    🏑 Start New Match
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
            startNewMatch
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


function buildHighlights() {

    const highlights = [];

    const attack =
        getAttackStats();

    const defence =
        getDefenceStats();

    const turnoverDiff =
        getTurnoverDifferential();

    if (
        turnoverDiff > 0
    ) {

        highlights.push(
            `
            <div class="summary-highlight">
                ✅ Positive Turnover Differential
                (+${turnoverDiff})
            </div>
            `
        );

    }

    if (
        attack.penaltyCornersWon >
        defence.penaltyCornersConceded
    ) {

        highlights.push(
            `
            <div class="summary-highlight">
                ✅ More Penalty Corners Won than Conceded
            </div>
            `
        );

    }

    if (
        defence.goalkeeperSaves >= 5
    ) {

        highlights.push(
            `
            <div class="summary-highlight">
                ✅ Strong Goalkeeping Performance
                (${defence.goalkeeperSaves} saves)
            </div>
            `
        );

    }

    if (
        highlights.length === 0
    ) {

        highlights.push(
            `
            <div class="summary-highlight">
                📊 Match summary available.
            </div>
            `
        );

    }

    return highlights.join("");

}



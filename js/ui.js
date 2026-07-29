
/*
=========================================================
MatchIQ
ui.js
Version: 2.0.2
=========================================================
*/

let highlightedButton = null;
let highlightTimeout = null;

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
                    class="${
                        App.currentMatch?.sport === "softball"
                            ? "timer softball-timer"
                            : "timer"
                    }"
                >
                    00:00
                </div>

                <div
                    id="periodDisplay"
                    class="period-label"
                >
                    ${
                        App.currentMatch.sport ===
                        "softball"

                            ? `INNING ${App.currentMatch.inning}`

                            : getPeriodLabel(
                                App.currentMatch.period
                            )
                    }
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
                ${
                    App.currentMatch.sport ===
                    "softball"
                        ? "🥎 End Inning"
                        : "⏭ Next Period"
                }
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
                        Export Match
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
            () => {

                if (
                    App.currentMatch.sport ===
                    "softball"
                ) {

                    switchSides();

                } else {

                    advancePeriod();

                }

            }
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

function highlightEventButton(button) {

    button.classList.add(
        "event-button-highlight"
    );

    if (highlightTimeout) {

        clearTimeout(
            highlightTimeout
        );

    }

    if (
        highlightedButton &&
        highlightedButton !== button
    ) {

        highlightedButton.classList.remove(
            "event-button-highlight"
        );

    }

    highlightedButton = button;

    highlightTimeout = setTimeout(
        () => {

            button.classList.remove(
                "event-button-highlight"
            );

            if (
                highlightedButton === button
            ) {

                highlightedButton = null;

            }

        },
        1000
    );

}

function highlightAndExecute(
    button,
    callback
) {

    button.classList.add(
        "event-button-highlight"
    );

    setTimeout(
        () => {

            callback();

        },
        250
    );

}

function renderEventSections() {

    console.log(
        "RENDER EVENT SECTIONS RUNNING"
    );

    const container =
        document.getElementById(
            "eventSections"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    console.log(
        "Current sport:",
        App.currentMatch?.sport
    );

    let visibleCategories = [];

    if (
        App.currentMatch &&
        App.currentMatch.sport === "softball"
    ) {

        visibleCategories = [
            "softball"
        ];

    } else {

        visibleCategories = [
            "attack",
            "defence",
            "discipline"
        ];

    }

    visibleCategories.forEach(
        categoryId => {

            const category =
                MatchIQ.categories.find(
                    c => c.id === categoryId
                );

            if (!category) {
                return;
            }

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
                `event-grid ${category.id}`;

            MatchIQ.events
                .filter(
                    event =>
                        event.category === category.id
                )
                .forEach(
                    event => {

                        const button =
                            document.createElement(
                                "button"
                            );

                        button.className =
                            `event-button ${event.category}`;

                        if (event.id === "strike") {
                            button.classList.add("strike");
                        }

                        if (event.id === "ball") {
                            button.classList.add("ball");
                        }

                        if (event.id === "out") {
                            button.classList.add("out");
                        }

                        if (event.id === "advance") {
                            button.classList.add("advance");
                        }

                        button.innerHTML =
                            `${event.icon}<br>${event.name}`;

                        button.addEventListener(
                            "click",
                            () => {

                                highlightEventButton(
                                    button
                                );

                                /* HOCKEY */

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
                                    event.id === "pcWon"
                                ) {
                                    showPenaltyCornerOutcomeOptions();
                                    return;
                                }

                                if (
                                    event.id === "pcConceded"
                                ) {
                                    showDefencePenaltyCornerOutcomeOptions();
                                    return;
                                }

                                /* SOFTBALL */

                                if (
                                    event.id === "strike"
                                ) {
                                    recordStrike();
                                    return;
                                }

                                if (
                                    event.id === "ball"
                                ) {
                                    recordBall();
                                    return;
                                }

                                if (
                                    event.id === "advance"
                                ) {
                                    advanceRunner();
                                    return;
                                }

                                if (
                                    event.id === "out"
                                ) {
                                    recordOut();
                                    return;
                                }

                                if (
                                    event.id === "switchSides"
                                ) {
                                    switchSides();
                                    return;
                                }
                                if (
                                    event.id === "homeRun"
                                ) {
                                    recordHomeRun();
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

                    }
                );

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

    if (
        App.currentMatch &&
        App.currentMatch.sport === "softball"
    ) {

        const score = getScore();

        const battingTeam =
            App.currentMatch.currentSide ===
            "ourBatting"
                ? "🟢 OUR TEAM BATTING"
                : "🔵 OPPONENT BATTING";

        const currentBatter =
            getCurrentBatter();

        scoreDisplay.innerHTML = `

            <div class="softball-scoreboard">

                <div class="softball-score">
                    ${score.our}
                    -
                    ${score.opposition}
                </div>

                <div class="softball-batting-status">
                    ${battingTeam}
                </div>

                <div class="count-row">

                    <div class="count-card balls">
                        <span>BALLS</span>
                        <strong>${App.currentMatch.balls}</strong>
                    </div>

                    <div class="count-card strikes">
                        <span>STRIKES</span>
                        <strong>${App.currentMatch.strikes}</strong>
                    </div>

                    <div class="count-card outs">
                        <span>OUTS</span>
                        <strong>${App.currentMatch.outs}</strong>
                    </div>

                </div>

                <div class="diamond">

                    <div class="base-label label-second">
                        2ND BASE
                    </div>

                    <div class="base-runner runner-second">
                        ${
                            App.currentMatch.bases.second
                                ? "#" + App.currentMatch.bases.second
                                : ""
                        }
                    </div>

                    <div class="
                        base second
                        ${
                            App.currentMatch.bases.second
                                ? "occupied"
                                : ""
                        }
                    "></div>

                    <div class="base-label label-third">
                        3RD BASE
                    </div>

                    <div class="base-runner runner-third">
                        ${
                            App.currentMatch.bases.third
                                ? "#" + App.currentMatch.bases.third
                                : ""
                        }
                    </div>

                    <div class="
                        base third
                        ${
                            App.currentMatch.bases.third
                                ? "occupied"
                                : ""
                        }
                    "></div>

                    <div class="base-label label-first">
                        1ST BASE
                    </div>

                    <div class="base-runner runner-first">
                        ${
                            App.currentMatch.bases.first
                                ? "#" + App.currentMatch.bases.first
                                : ""
                        }
                    </div>

                    <div class="
                        base first
                        ${
                            App.currentMatch.bases.first
                                ? "occupied"
                                : ""
                        }
                    "></div>

                    <div class="base home"></div>

                </div>

                    <div class="home-runner">

                        #${currentBatter}

                    </div>

                    <div class="home-label">

                        HOME

                    </div>

            </div>

        `;

        return;

    }

    scoreDisplay.textContent =
        `${score.our} - ${score.opposition}`;

}


function getPeriodLabel(
    period
) {

       if (
            App.currentMatch &&
            App.currentMatch.sport ===
            "softball"
        ) {

            return `Inning ${App.currentMatch.inning}`;

        }

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

    };
 
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
            ⏭ Period Changed: ${getPeriodLabel(event.value)}
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

   /* alert(
        `Period advanced to ${nextPeriod}`
    );*/
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

    if (
        App.currentMatch &&
        App.currentMatch.sport ===
        "softball"
    ) {

        periodDisplay.textContent =
            `INNING ${App.currentMatch.inning}`;

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

    /*if (
        confirm(
            "Remove the last captured event?"
        )
    ) */{

        removeLastEvent();

    }
}

function endMatch() {
    pauseTimer();
    completeMatch();

    if (
        App.currentMatch &&
        App.currentMatch.sport === "softball"
    ) {
        renderSoftballSummary();
    } else {
        renderMatchSummary();
    }
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
        
        <div id="summaryCapture">

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
                
                ${renderAttackJourneyTable()}

                ${renderAttackAnalysisTable()}
               
                ${renderEffectivenessTable()}

                ${renderDefenceAnalysisTable()}

                </div>

                ${renderDisciplineTable()}

                ${renderMatchInformationTable()}

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
                        Export Match
                    </button>
                   
                    
                    <button
                        id="exportPdfButton"
                        class="summary-button exportPDF"
                        disabled
                    >
                        📸 Export to PDF
                    </button>


                    <button
                        id="newMatchButton"
                        class="summary-button new-match"
                    >
                        🏑 Hockey Home
                    </button>

                </div>
            </div>        
        </div>

    `;           
        
    console.log(
        document.getElementById("summaryExportButton")
    );

    console.log(
        document.getElementById("exportPdfButton")
    );

    document
        .getElementById(
            "summaryExportButton"
        )
        .addEventListener(
            "click",
            exportMatch
        );

    
    const exportPdfButton =
        document.getElementById(
            "exportPdfButton"
        );

    if (exportPdfButton) {
        
        exportPdfButton.disabled = true;
        exportPdfButton.addEventListener(
            "click",
            exportSummaryPdf
        );
    }
        
        
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
    focusOutcomePanel();

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
    focusOutcomePanel();
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
    focusOutcomePanel();
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
    focusOutcomePanel();
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
        ||
        outcome === "longCorner"
    )
    {

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
                class="event-button attack"
                onclick="recordAttackPenaltyCornerOutcome('shotOnTarget')"
            >
                🎯<br>
                Shot On Target
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackPenaltyCornerOutcome('shotOffTarget')"
            >
                ⚪<br>
                Shot Off Target
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackPenaltyCornerOutcome('pcReAwarded')"
            >
                🚩<br>
                Penalty Corner
            </button>

            <button
                class="event-button attack"
                onclick="recordAttackPenaltyCornerOutcome('entryTurnoverLost')"
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


function recordAttackPenaltyCornerOutcome( outcome ) {

    if ( outcome === "shotOnTarget" ) {
        recordEvent( "shotOnTarget" );
        showAttackPenaltyCornerOutcomeOptions();
        return;
    }

    if ( outcome === "shotOffTarget" ) {
        recordEvent( "shotOffTarget" );
        showAttackPenaltyCornerOutcomeOptions();
        return;
    }

    if ( outcome === "shotBlocked" ) {
        recordEvent( "shotBlocked" );
        showAttackPenaltyCornerOutcomeOptions();
        return;
    }
       
    if ( outcome === "pcReAwarded" ) {

        //recordEvent( "pcReAwarded" );

        recordEvent( "entryPenaltyCorner" );

        showAttackPenaltyCornerOutcomeOptions();

        return;
    }

    recordEvent( outcome );

    if (
        outcome === "pcGoal"
        ||
        outcome === "entryTurnoverLost"
    ) {

        App.currentMatch.activeAttackId =
            null;

        removeOutcomePanel();

        return;
    }

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
function showSoftballMenu() {

    hideAllScreens();

    const screen =
        document.getElementById(
            "softballMenuScreen"
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
                🥎 Softball
            </h1>

            <div class="hockey-menu-buttons">

                <button
                    class="sport-button softball"
                    onclick="showSoftballSetup()"
                >
                    ▶ New Match
                </button>

                <button
                    class="sport-button history"
                    onclick="renderSoftballHistory()"
                >
                    📊 Match History
                </button>

            </div>

        </div>

    `;

}
function showSoftballSetup() {

    hideAllScreens();

    App.selectedSport =
        "softball";

    document
        .getElementById(
            "softballMenuScreen"
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

    selectSport(
        "softball"
    );

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
        "softballMenuScreen",
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

function focusOutcomePanel() {

    setTimeout(() => {

        const panel =
            document.getElementById(
                "outcomePanel"
            );

        if (!panel) {
            return;
        }

        const rect =
            panel.getBoundingClientRect();

        const scrollTop =
            window.pageYOffset;

        const stickyHeaderHeight =
            220; // adjust if needed

        window.scrollTo({

            top:
                rect.top +
                scrollTop -
                stickyHeaderHeight,

            behavior: "smooth"

        });

    }, 100);

}

function getGoalsConceded() {

    return (

        getEventCount(
            "goalConceded"
        )

        +

        getEventCount(
            "pcGoalConceded"
        )

        +

        getEventCount(
            "psGoalConceded"
        )

    );

}
document.addEventListener(
    "click",
    (e) => {

        const button =
            e.target.closest(
                ".event-button"
            );

        if (button) {

            highlightEventButton(
                button
            );

        }

    }
);

function renderPeriodRow(
    label,
    eventIds,
    indent = 0
) {

    const periods =
        App.currentMatch.format === "4"
            ? ["Q1","Q2","Q3","Q4"]
            : ["H1","H2"];

    const values =
        periods.map(
            period =>

                eventIds.reduce(
                    (sum, eventId) =>

                        sum +

                        getEventCountByPeriod(
                            eventId,
                            period
                        ),

                    0
                )
        );

    const total =
        values.reduce(
            (a,b) => a + b,
            0
        );

    let rowClass = "";

    if (indent === 0) {

        rowClass =
            "period-parent-row";

    }
    else if (indent === 1) {

        rowClass =
            "period-child-row";

    }
    else {

        rowClass =
            "period-grandchild-row";

    }

    return `

        <tr class="${rowClass}">

            <td
                style="
                    padding-left:${indent * 28}px;
                "
            >
                ${label}
            </td>

            ${values.map(
                value =>
                    `<td>${value}</td>`
            ).join("")}

            <td>${total}</td>

        </tr>

    `;

}

function renderAttackJourneyTable() {

    const periods =
        getPeriods();

    const headers =
        periods
            .map(
                period =>
                    `<th>${period}</th>`
            )
            .join("");

    return `

        <div class="card summary-section">

            <h3>
                Attack Journey
            </h3>

            <table class="period-table">

                <tr>

                    <th>
                        
                    </th>

                    ${headers}

                    <th>
                        Total
                    </th>

                </tr>

                ${renderPeriodRow(
                    "Circle Entries",
                    [
                        "entryLeft",
                        "entryTopD",
                        "entryRight"
                    ]
                )}

                ${renderPeriodRow(
                    "Shots",
                    [
                        "shotOnTarget",
                        "shotOffTarget",
                        "shotBlocked"
                    ]
                )}

                ${renderPeriodRow(
                    "Penalty Corners",
                    [
                        "entryPenaltyCorner"
                    ]
                )}

                ${renderPeriodRow(
                    "Long Corners",
                    [
                        "entryLongCorner"
                    ]
                )}

                ${renderPeriodRow(
                    "Turnovers Lost",
                    [
                        "entryTurnoverLost"
                    ]
                )}

                ${renderPeriodRow(
                    "Goals",
                    [
                        "goalScored",
                        "pcGoal"
                    ]
                )}

            </table>

        </div>

    `;

}

function renderAttackAnalysisTable() {

    const periods =
        getPeriods();

    const headers =
        periods
            .map(
                period =>
                    `<th>${period}</th>`
            )
            .join("");

    return `

        <div class="card summary-section">

            <h3>
                Attack Analysis
            </h3>

            <table class="period-table">

                <tr>

                    <th>
                        
                    </th>

                    ${headers}

                    <th>
                        Total
                    </th>

                </tr>

                ${renderPeriodRow(
                    "Circle Entries",
                    [
                        "entryLeft",
                        "entryTopD",
                        "entryRight"
                    ]
                )}

                ${renderPeriodRow(
                    "↳ Left",
                    ["entryLeft"],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Top D",
                    ["entryTopD"],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Right",
                    ["entryRight"],
                    1
                )}

                ${renderPeriodRow(
                    "Shots",
                    [
                        "shotOnTarget",
                        "shotOffTarget",
                        "shotBlocked"
                    ]
                )}

                ${renderPeriodRow(
                    "↳ On Target",
                    ["shotOnTarget"],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Off Target",
                    ["shotOffTarget"],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Blocked",
                    ["shotBlocked"],
                    1
                )}

                ${renderPeriodRow(
                    "Attack Outcomes",
                    [],
                    0
                )}

                ${renderPeriodRow(
                    "↳ Penalty Corners",
                    [
                        "entryPenaltyCorner"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳↳ Converted",
                    [
                        "pcGoal"
                    ],
                    2
                )}

                ${renderPeriodRow(
                    "↳↳ Saved",
                    [
                        "pcSaved"
                    ],
                    2
                )}

                ${renderPeriodRow(
                    "↳↳ Missed",
                    [
                        "pcMissed"
                    ],
                    2
                )}

                ${renderPeriodRow(
                    "↳↳ Broken Down",
                    [
                        "pcBrokenDown"
                    ],
                    2
                )}

                ${renderPeriodRow(
                    "↳ Long Corners",
                    [
                        "entryLongCorner"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Penalty Strokes",
                    [
                        "psWon"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Turnovers Lost",
                    [
                        "entryTurnoverLost"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "Goals Scored",
                    [
                        "goalScored",
                        "pcGoal"
                    ]
                )}

                ${renderPeriodRow(
                    "↳ Field Goals",
                    [
                        "goalScored"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ PC Goals",
                    [
                        "pcGoal"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "Turnovers Won",
                    [],
                    0
                )}

                ${renderPeriodRow(
                    "↳ Attacking 25",
                    [
                        "turnoverAttacking25"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Midfield",
                    [
                        "turnoverMidfield"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Defensive 25",
                    [
                        "turnoverDefensive25"
                    ],
                    1
                )}

            </table>

        </div>

    `;

}

function renderDefenceAnalysisTable() {

    const periods =
        getPeriods();

    const headers =
        periods
            .map(
                period =>
                    `<th>${period}</th>`
            )
            .join("");

    return `

        <div class="card summary-section">

            <h3>
                Defence Analysis
            </h3>

            <table class="period-table">

                <tr>

                    <th></th>

                    ${headers}

                    <th>Total</th>

                </tr>

                ${renderPeriodRow(
                    "Circle Entries Against",
                    [
                        "defenceEntryLeft",
                        "defenceEntryTopD",
                        "defenceEntryRight"
                    ]
                )}

                ${renderPeriodRow(
                    "↳ Left",
                    [
                        "defenceEntryLeft"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Top D",
                    [
                        "defenceEntryTopD"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Right",
                    [
                        "defenceEntryRight"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "Goals Conceded",
                    [
                        "goalConceded",
                        "pcGoalConceded"
                    ]
                )}

                ${renderPeriodRow(
                    "Goalkeeper Saves",
                    [
                        "save"
                    ]
                )}

                ${renderPeriodRow(
                    "Turnovers Lost",
                    []
                )}

                ${renderPeriodRow(
                    "↳ Attacking 25",
                    [
                        "turnoverAttacking25Lost"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Midfield",
                    [
                        "turnoverMidfieldLost"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Defensive 25",
                    [
                        "turnoverDefensive25Lost"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "Long Corners",
                    [
                        "longCornersAgainst"
                    ]
                )}

                ${renderPeriodRow(
                    "Penalty Corners Conceded",
                    [
                        "pcConceded"
                    ]
                )}

                ${renderPeriodRow(
                    "↳ Goals",
                    [
                        "pcGoalConceded"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ First Wave Saves",
                    [
                        "pcFirstWaveSave"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ GK Saves",
                    [
                        "pcGoalkeeperSave"
                    ],
                    1
                )}

                ${renderPeriodRow(
                    "↳ Second Wave Saves",
                    [
                        "pcSecondWaveSave"
                    ],
                    1
                )}

            </table>

        </div>

    `;

}
function renderDisciplineTable() {

    const periods =
        getPeriods();

    const headers =
        periods
            .map(
                period =>
                    `<th>${period}</th>`
            )
            .join("");

    return `

        <div class="card summary-section">

            <h3>
                Discipline
            </h3>

            <table class="period-table">

                <tr>

                    <th></th>

                    ${headers}

                    <th>Total</th>

                </tr>

                ${renderPeriodRow(
                    "Green Cards",
                    [
                        "greenCard"
                    ]
                )}

                ${renderPeriodRow(
                    "Yellow Cards",
                    [
                        "yellowCard"
                    ]
                )}

                ${renderPeriodRow(
                    "Red Cards",
                    [
                        "redCard"
                    ]
                )}

            </table>

        </div>

    `;

}

function renderMatchInformationTable() {

    const periods =
        getPeriods();

    const headers =
        periods
            .map(
                period =>
                    `<th>${period}</th>`
            )
            .join("");

    return `

        <div class="card summary-section">

            <h3>
                Match Information
            </h3>

            <table class="period-table">

                <tr>

                    <th></th>

                    ${headers}

                    <th>Total</th>

                </tr>

                ${renderPeriodRow(
                    "Events Recorded",
                    getAllEventIds()
                )}

            </table>

            <div
                style="
                    margin-top:16px;
                "
            >

                ${renderSummaryStat(
                    "Match Duration",
                    formatTime(
                        App.timer.seconds
                    )
                )}

            </div>

        </div>

    `;

}
function getAllEventIds() {

    return MatchIQ.events.map(
        event => event.id
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

    return Math.round(
        numerator /
        denominator *
        100
    );

}

function getEffectivenessByPeriod(
    period
) {

    if (
        period === "ALL"
    ) {

        const effectiveness =
            getMatchStatistics()
                .effectiveness;

        return {

            entryToShot:
                effectiveness.entryToShotConversion,

            fieldGoalConversion:
                effectiveness.fieldGoalConversion,

            entryToGoal:
                effectiveness.entryToGoalConversion,

            shotAccuracy:
                effectiveness.shotAccuracy,

            pcConversion:
                effectiveness.pcConversion

        };

    }

    const entries =

        getEventCountByPeriod(
            "entryLeft",
            period
        )

        +

        getEventCountByPeriod(
            "entryTopD",
            period
        )

        +

        getEventCountByPeriod(
            "entryRight",
            period
        );

    const shotsOnTarget =
        getEventCountByPeriod(
            "shotOnTarget",
            period
        );

    const shotsOffTarget =
        getEventCountByPeriod(
            "shotOffTarget",
            period
        );

    const shotsBlocked =
        getEventCountByPeriod(
            "shotBlocked",
            period
        );

    const shots =
        shotsOnTarget
        +
        shotsOffTarget
        +
        shotsBlocked;

    const fieldGoals =
        getEventCountByPeriod(
            "goalScored",
            period
        );

    const pcGoals =
        getEventCountByPeriod(
            "pcGoal",
            period
        );

    const penaltyCorners =
        getEventCountByPeriod(
            "entryPenaltyCorner",
            period
        );

    const attacksWithShots =
        getAttacksWithShotsByPeriod(
            period
        );

    const attacksWithGoals =
        getAttacksWithGoalsByPeriod(
            period
        );

    return {

        entryToShot:

            calculatePercentage(
                attacksWithShots,
                entries
            ),

        fieldGoalConversion:

            calculatePercentage(
                fieldGoals,
                shotsOnTarget
            ),

        entryToGoal:

            calculatePercentage(
                attacksWithGoals,
                entries
            ),

        shotAccuracy:

            calculatePercentage(
                shotsOnTarget,
                shots
            ),

        pcConversion:

            calculatePercentage(
                pcGoals,
                penaltyCorners
            )

    };

}

function renderPercentageRow(
    label,
    property
) {

    const periods =
        getPeriods();

    const values =
        periods.map(
            period =>

                getEffectivenessByPeriod(
                    period
                )[property]
        );

    const overall =

        getEffectivenessByPeriod(
            "ALL"
        )[property];



    return `

        <tr>

            <td>
                ${label}
            </td>

            ${values.map(
                value =>
                    `<td>${value}%</td>`
            ).join("")}

            <td>
                ${overall}%
            </td>

        </tr>

    `;

}

function renderEffectivenessTable() {

    const periods =
        getPeriods();

    const headers =
        periods
            .map(
                period =>
                    `<th>${period}</th>`
            )
            .join("");

    return `

        <div class="card summary-section">

            <h3>
                Attacking Effectiveness
            </h3>

            <table class="period-table">

                <tr>

                    <th></th>

                    ${headers}

                    <th>Total</th>

                </tr>

                ${renderPercentageRow(
                    "Entry → Shot %",
                    "entryToShot"
                )}

                ${renderPercentageRow(
                    "Field Goal Conversion %",
                    "fieldGoalConversion"
                )}

                ${renderPercentageRow(
                    "Entry → Goal %",
                    "entryToGoal"
                )}

                ${renderPercentageRow(
                    "Shot Accuracy %",
                    "shotAccuracy"
                )}

                ${renderPercentageRow(
                    "PC Conversion %",
                    "pcConversion"
                )}

            </table>

        </div>

    `;

}
function renderSoftballSummary() {

    const liveScreen =
        document.getElementById(
            "liveMatchScreen"
        );

    const score = getScore();

    liveScreen.innerHTML = `
        <div class="summary-screen">

            <h2>🥎 Match Summary</h2>

           <div class="softball-summary-header">

                <div class="summary-team">
                    ${App.currentMatch.ourTeam}
                </div>

                <div class="summary-score">
                    ${score.our} - ${score.opposition}
                </div>

                <div class="summary-team">
                    ${App.currentMatch.opponent}
                </div>

            </div>

            <div class="card">

                <h3>Game Statistics</h3>

                <table class="softball-summary-table">

                    <tr>
                        <th></th>
                        <th>FOR</th>
                        <th>AGAINST</th>
                    </tr>

                    <tr>
                        <td>Innings Completed</td>
                        <td>${App.currentMatch.inning}</td>
                        <td>${App.currentMatch.inning}</td>
                    </tr>

                    <tr>
                        <td>Runs</td>
                        <td>${score.our}</td>
                        <td>${score.opposition}</td>
                    </tr>

                    <tr>
                        <td class="sub-stat">
                            ↳ Home Runs
                        </td>

                        <td>
                            ${Math.min(
                                getEventCount(
                                    "homeRun"
                                ),
                                score.our
                            )}
                        </td>

                        <td>
                            -
                        </td>

                    </tr>

                    <tr>
                        <td>Strikes</td>
                        <td>${getEventCount("strike")}</td>
                        <td>-</td>
                    </tr>

                    <tr>
                        <td>Balls</td>
                        <td>${getEventCount("ball")}</td>
                        <td>-</td>
                    </tr>

                    <tr>
                        <td>Outs</td>
                        <td>${getEventCount("out")}</td>
                        <td>-</td>
                    </tr>

                </table>

            </div>

            <div class="summary-actions">

                <button
                    id="summaryExportButton"
                    class="summary-button export">
                    Export Match
                </button>

                <button
                    id="newMatchButton"
                    class="summary-button new-match">
                    🥎 Softball Home
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
            returnToSoftballHome
        );
}
function returnToSoftballHome() {

    App.currentMatch = null;

    showSoftballMenu();

}

function showSoftballMenu() {

    hideAllScreens();

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

    document
        .getElementById(
            "historyScreen"
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
            "softballMenuScreen"
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
                🥎 Softball
            </h1>

            <div class="hockey-menu-buttons">

                <button
                    class="sport-button softball"
                    onclick="showSoftballSetup()"
                >
                    ▶ New Match
                </button>

                <button
                    class="sport-button history"
                    onclick="renderSoftballHistory()"
                >
                    📖 Match History
                </button>

            </div>

        </div>

    `;

}

function returnHome() {

    hideAllScreens();

    document
        .getElementById(
            "homeScreen"
        )
        .classList.remove(
            "hidden"
        );
}
function renderSoftballHistory() {

    alert(
        "Softball Match History coming next.\n\nFor tomorrow's match please use the scoring functionality."
    );

}
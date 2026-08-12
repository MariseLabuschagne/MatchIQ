
/*
=========================================================
MatchIQ
ui.js
Version: 2.0.2
=========================================================
*/

let highlightedButton = null;
let highlightTimeout = null;
let selectedRunner = null;

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

            <div class="timer-pill">

                <div
                    id="timerDisplay"
                    class="${
                        isSoftballSport(App.currentMatch)
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
                        isSoftballSport(App.currentMatch)

                            ? `INNING ${App.currentMatch.inning}`

                            : getPeriodLabel(
                                App.currentMatch.period
                            )
                    }
                </div>

            </div>

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

        </div>

        ${
            App.currentMatch.sport !==
            "softball"

                ? `

                    <div class="card">

                        <div id="eventSections"></div>

                    </div>

                `

                : ""
        }

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
        .getElementById(
            "pauseButton"
        )
        .addEventListener(
            "click",
            toggleTimer
        );

    document
        .getElementById(
            "resetButton"
        )
        .addEventListener(
            "click",
            resetTimer
        );

    document
        .getElementById(
            "nextPeriodButton"
        )
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
        .getElementById(
            "undoButton"
        )
        .addEventListener(
            "click",
            undoLastEvent
        );

    document
        .getElementById(
            "exportButton"
        )
        .addEventListener(
            "click",
            exportMatch
        );

    document
        .getElementById(
            "endMatchButton"
        )
        .addEventListener(
            "click",
            endMatch
        );

    if (
        App.currentMatch.sport !==
        "softball"
    ) {

        renderEventSections();

    }

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
        isSoftballSport(App.currentMatch)
    ) {

        visibleCategories = [];

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
                category.id === "defence"
                    ? "Defence (against)"
                    : category.name;

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
                                    event.id === "hit"
                                ) {
                                    recordHit();
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
        isSoftballSport(App.currentMatch)
    ) {

        const battingTeam =
            App.currentMatch.currentSide ===
            "ourBatting"
                ? "🟢 OUR TEAM BATTING"
                : "🔵 OPPONENT BATTING";

        const currentBatter =
            getCurrentBatter();

        scoreDisplay.innerHTML = `

            <div class="softball-scoreboard">
                <div class="softball-score-header">

                    <div class="softball-team-name left">
                        ${App.currentMatch.ourTeam}
                    </div>

                    <div class="softball-score">
                        ${score.our}
                        -
                        ${score.opposition}
                    </div>

                    <div class="softball-team-name right">
                        ${App.currentMatch.opponent}
                    </div>

                </div>

                <div class="softball-batting-status">
                    ${battingTeam}
                </div>

                <div class="pitcher-section">

                    <div class="pitcher-buttons">

                        <button
                            class="
                                pitcher-button
                                ${
                                    getActivePitcherSide()
                                        .active === 1
                                        ? "active"
                                        : ""
                                }
                            "
                            onclick="setActivePitcher(1)"
                        >
                            ${
                                getActivePitcherSide()
                                    .pitcher1
                                    .name || "Pitcher 1"
                            }
                        </button>

                        <button
                            class="
                                pitcher-button
                                ${
                                    getActivePitcherSide()
                                        .active === 2
                                        ? "active"
                                        : ""
                                }
                            "
                            onclick="setActivePitcher(2)"
                        >
                            ${
                                getActivePitcherSide()
                                    .pitcher2
                                    .name || "Pitcher 2"
                            }
                        </button>

                    </div>

                </div>

                <div class="count-row">

                    <div
                        class="count-card balls"
                        onclick="
                            highlightEventButton(this);
                            recordBall();
                        "
                    >

                        <span>BALLS</span>
                        <strong>${App.currentMatch.balls}</strong>
                    </div>


                    <div
                        class="count-card strikes"
                        onclick="
                            highlightEventButton(this);
                            recordStrike();
                        "
                    >
                        <span>STRIKES</span>
                        <strong>${App.currentMatch.strikes}</strong>
                    </div>

                    <div
                        class="count-card foul"
                        onclick="
                            highlightEventButton(this);
                            recordFoul();
                        "
                    >
                        <span>FOUL</span>
                        <strong>⚠️</strong>
                    </div>

                    <div
                        class="count-card hits"
                        onclick="
                            highlightEventButton(this);
                            recordHit();
                        "
                    >
                        <span>HITS</span>
                        <strong>${App.currentMatch.hits || 0}</strong>
                    </div>

                    <div
                        class="count-card outs"
                        onclick="
                            highlightEventButton(this);
                            recordOut();
                        "
                    >
                        <span>OUTS</span>
                        <strong>${App.currentMatch.outs}</strong>
                    </div>

                </div>

                <div class="softball-action-row">

                    <button
                        class="softball-mini-button switch"
                        onclick="switchSides()"
                    >
                        🔄 Switch Sides
                    </button>

                    <button
                        class="softball-mini-button homerun"
                        onclick="recordHomeRun()"
                    >
                        ⭐ Home Run
                    </button>

                    <button
                        class="softball-mini-button undo"
                        onclick="undoLastRun()"
                    >
                        ↩️ Undo Run
                    </button>

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

                    <div
                        onclick="
                            if (selectedRunner) {

                                moveSelectedRunner('second');

                            } else if (
                                App.currentMatch.bases.second
                            ) {

                                selectRunner('second');

                            }
                        "
                        class="
                            base second
                            ${
                                App.currentMatch.bases.second
                                    ? 'occupied'
                                    : ''
                            }
                            ${
                                selectedRunner === 'second'
                                    ? 'selected-base'
                                    : ''
                            }
                        "
                    ></div>

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

                    <div
                        onclick="
                            if (selectedRunner) {

                                moveSelectedRunner('third');

                            } else if (
                                App.currentMatch.bases.third
                            ) {

                                selectRunner('third');

                            }
                        "
                        class="
                            base third
                            ${
                                App.currentMatch.bases.third
                                    ? 'occupied'
                                    : ''
                            }
                            ${
                                selectedRunner === 'third'
                                    ? 'selected-base'
                                    : ''
                            }
                        "
                    ></div>

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

                    <div
                        onclick="
                            if (selectedRunner) {

                                moveSelectedRunner('first');

                            } else if (
                                App.currentMatch.bases.first
                            ) {

                                selectRunner('first');

                            }
                        "
                        class="
                            base first
                            ${
                                App.currentMatch.bases.first
                                    ? 'occupied'
                                    : ''
                            }
                            ${
                                selectedRunner === 'first'
                                    ? 'selected-base'
                                    : ''
                            }
                        "
                    ></div>

                    <div
                        class="
                            base home
                            ${
                                selectedRunner === 'batter'
                                    ? 'selected-base'
                                    : ''
                            }
                        "
                        onclick="
                            if (selectedRunner) {

                                if (selectedRunner === 'batter') {
                                    alert('Batter cannot be moved directly to Home. Use Home Run.');
                                } else {
                                    moveSelectedRunner('home');
                                }

                            } else {

                                selectRunner('batter');

                            }
                        "
                    ></div>

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
            isSoftballSport(App.currentMatch)
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
        isSoftballSport(App.currentMatch)
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




function renderMatchInsights() {

    const stats =
        getMatchStatistics();

    const attack =
        stats.attack;

    const defence =
        stats.defence;

    const effectiveness =
        stats.effectiveness;

    const insights = [];

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
    if (
        outcome === "entryLongCorner"
    ) {

        App.currentMatch.activeAttackId =
            null;

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
    getMatchHistory(
        "hockey"
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
                        e.eventType === "goalScored" || e.eventType === "pcGoal"
                ).length;

            const oppositionGoals =
                matchEvents.filter(
                    e =>
                        e.eventType === "goalConceded" || e.eventType === "pcGoalConceded"
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

    let match =
        getHistoricalMatch(
            matchId,
            "softball"
        );

    if (!match) {

        match =
            getHistoricalMatch(
                matchId,
                "hockey"
            );

    }

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

    App.selectedSport =
        match.sport ||
        "hockey";

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

    if (
        isSoftballSport(match)
    ) {

        renderSoftballSummary();

    } else {

        renderMatchSummary();

    }

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

    App.selectedSport =
        "hockey";

    selectSport(
        "hockey"
    );

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
function selectRunner(position) {

    if (selectedRunner === position) {

        selectedRunner = null;

    } else {

        selectedRunner = position;

    }

    updateScoreboard();

}

function moveSelectedRunner(
    destination
) {

    if (
        !selectedRunner
    ) {

        return;

    }

    moveRunner(
        selectedRunner,
        destination
    );

    selectedRunner = null;
    selectedBase = null;

    updateScoreboard();

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

function getSoftballInnings() {
    const currentInning =
        App.currentMatch?.inning || 1;

    const innings = [];

    for (let i = 1; i <= currentInning; i++) {
        innings.push(`I${i}`);
    }

    return innings;
}

function getSoftballPitchingEventCount(
    eventId,
    inningLabel
) {
    const inningNumber =
        Number(inningLabel.replace("I", ""));

    if (
        !App.currentMatch ||
        !App.currentMatch.events
    ) {
        return 0;
    }

    return App.currentMatch.events.filter(
        event =>
            event.eventType === eventId &&
            event.inning === inningNumber &&
            event.battingSide === "opponentBatting"
    ).length;
}

function getSoftballPitchingComment(
    inningLabel
) {
    const runsAllowed =
        getSoftballPitchingEventCount(
            "runAgainst",
            inningLabel
        );

    const outs =
        getSoftballPitchingEventCount(
            "out",
            inningLabel
        );

    const hits =
        getSoftballPitchingEventCount(
            "hit",
            inningLabel
        );

    const balls =
        getSoftballPitchingEventCount(
            "ball",
            inningLabel
        );

    const strikes =
        getSoftballPitchingEventCount(
            "strike",
            inningLabel
        );

    const parts = [];

    if (runsAllowed) {
        parts.push(`${runsAllowed} run${runsAllowed === 1 ? "" : "s"}`);
    }

    if (outs) {
        parts.push(`${outs} out${outs === 1 ? "" : "s"}`);
    }

    if (balls) {
        parts.push(`${balls} ball${balls === 1 ? "" : "s"}`);
    }

    if (strikes) {
        parts.push(`${strikes} strike${strikes === 1 ? "" : "s"}`);
    }

    return parts.length > 0
        ? parts.join(", ")
        : "No pitching events recorded.";
}

function buildPitchingSummaryHtml() {

    const pitchers =
        App.currentMatch?.pitchers?.ourTeam;

    if (!pitchers) {
        return "";
    }

    const pitcherKeys = [
        "pitcher1",
        "pitcher2"
    ];

    const metrics = [
        {
            label: "Pitches",
            value: pitcher =>
                (pitcher.balls || 0) +
                (pitcher.strikes || 0)
        },
        {
            label: "Strikes",
            value: pitcher => pitcher.strikes || 0
        },
        {
            label: "Walks",
            value: pitcher => pitcher.walks || 0
        },
        {
            label: "Strikeouts",
            value: pitcher => pitcher.strikeouts || 0
        },
        {
            label: "Outs",
            value: pitcher => pitcher.outs || 0
        },
        {
            label: "Earned Runs",
            value: pitcher => pitcher.runsAllowed || 0
        },
        {
            label: "Innings Pitched",
            value: pitcher => {
                const outs = pitcher.outs || 0;
                return `${Math.floor(outs / 3)}.${outs % 3}`;
            }
        }
    ];

    let html = `
        <div class="card summary-section">
            <h3>Pitching Summary</h3>

            <table class="period-table">
                <tr>
                    <th>Metric</th>
                    ${pitcherKeys.map(key => {
                        const pitcher = pitchers[key] || {};
                        return `<th>${pitcher.name || key.replace(/pitcher/, "Pitcher ")}</th>`;
                    }).join("")}
                </tr>
    `;

    metrics.forEach(metric => {
        html += `
            <tr>
                <td>${metric.label}</td>
                ${pitcherKeys.map(key => {
                    const pitcher = pitchers[key] || {};
                    return `<td>${metric.value(pitcher)}</td>`;
                }).join("")}
            </tr>
        `;
    });

    html += `
            </table>
        </div>

        <div class="card summary-section">
            <h3>Pitching Comments</h3>

            <table class="period-table">
                <tr>
                    <th>Inning</th>
                    <th>Comment</th>
                </tr>
                ${getSoftballInnings().map(inning => `
                    <tr>
                        <td>${inning}</td>
                        <td>${getSoftballPitchingComment(inning)}</td>
                    </tr>
                `).join("")}
            </table>
        </div>
    `;

    return html;
}

function getSoftballRunsByInning() {
    if (
        !App.currentMatch ||
        !App.currentMatch.events
    ) {
        return [];
    }

    const inningTotals = {};

    App.currentMatch.events.forEach(event => {
        if (
            event.eventType !== "runFor" &&
            event.eventType !== "runAgainst"
        ) {
            return;
        }

        const inning = Number(event.inning) || 1;

        if (!inningTotals[inning]) {
            inningTotals[inning] = {
                inning,
                our: 0,
                opp: 0
            };
        }

        if (event.eventType === "runFor") {
            inningTotals[inning].our++;
        } else {
            inningTotals[inning].opp++;
        }
    });

    return Object.values(inningTotals);
}

function buildSoftballMatchInsightsHtml() {
    const score = getScore();
    const ourName = App.currentMatch?.ourTeam || "Our Team";
    const oppName = App.currentMatch?.opponent || "Opposition";
    const homeRunsFor = getSoftballEventCount(
        "homeRun",
        "ourBatting"
    );
    const homeRunsAgainst = getSoftballEventCount(
        "homeRun",
        "opponentBatting"
    );

    let outcomeText;
    const runDiff = score.our - score.opposition;

    if (runDiff === 0) {
        outcomeText = `The game finished tied ${score.our}-${score.opposition}.`;
    } else if (runDiff > 0) {
        outcomeText = `${ourName} won by ${runDiff} run${runDiff === 1 ? "" : "s"}.`;
    } else {
        const diff = Math.abs(runDiff);
        outcomeText = `${oppName} won by ${diff} run${diff === 1 ? "" : "s"}.`;
    }

    const pitchers =
        App.currentMatch?.pitchers?.ourTeam || {};

    const pitcherStats = [
        pitchers.pitcher1 || {},
        pitchers.pitcher2 || {}
    ];

    const bestPitcher = pitcherStats.reduce((best, pitcher) => {
        if (!best) {
            return pitcher;
        }

        const bestOuts = best.outs || 0;
        const pitcherOuts = pitcher.outs || 0;

        if (pitcherOuts > bestOuts) {
            return pitcher;
        }

        if (
            pitcherOuts === bestOuts &&
            (pitcher.runsAllowed || 0) < (best.runsAllowed || 0)
        ) {
            return pitcher;
        }

        return best;
    }, null);

    const bestPitcherName =
        bestPitcher?.name || "No pitcher data";
    const bestPitcherText = bestPitcher
        ? `${bestPitcherName} recorded ${bestPitcher.outs || 0} out${bestPitcher.outs === 1 ? "" : "s"} and allowed ${bestPitcher.runsAllowed || 0} run${bestPitcher.runsAllowed === 1 ? "" : "s"}.`
        : "No pitching data available.";

    const inningTotals = getSoftballRunsByInning();
    const largestInning = inningTotals.reduce(
        (best, current) => {
            const currentTotal = current.our + current.opp;
            const bestTotal = best ? best.our + best.opp : 0;
            return currentTotal > bestTotal ? current : best;
        },
        null
    );

    const keyInningText = largestInning
        ? `Biggest scoring inning was I${largestInning.inning} with ${largestInning.our + largestInning.opp} run${largestInning.our + largestInning.opp === 1 ? "" : "s"}.`
        : "No scoring innings recorded.";

    return `
        <div class="card summary-section">
            <h3>Match Insights</h3>
            <div class="insights-copy">
                <p>${outcomeText}</p>
                <p>Home runs: ${homeRunsFor} for ${ourName}, ${homeRunsAgainst} for ${oppName}.</p>
                <p>${bestPitcherText}</p>
                <p>${keyInningText}</p>
            </div>
        </div>
    `;
}

function getSoftballHitsByBatter(side) {
    if (
        !App.currentMatch ||
        !App.currentMatch.events
    ) {
        return {};
    }

    return App.currentMatch.events
        .filter(
            event =>
                event.eventType === "hit" &&
                event.battingSide === side
        )
        .reduce((counts, event) => {
            const batter =
                event.currentBatter ||
                "Unknown";

            counts[batter] =
                (counts[batter] || 0) + 1;

            return counts;
        }, {});
}

function buildSoftballBattingStatsHtml() {

    const innings =
        getSoftballInnings();

    const rows = [];

    const roster =
        App.currentMatch?.roster?.ourTeam || [];

    const batterStats =
        getSoftballBatterStats();

    for (let i = 1; i <= 9; i++) {

        const batter = i;

        const name =
            roster[i - 1] || `#${i}`;

        const perInning =
            innings.map(inningLabel => {

                const inningNumber =
                    Number(
                        inningLabel.replace(
                            "I",
                            ""
                        )
                    );

                const count =
                    (App.currentMatch?.events || [])
                    .filter(e =>

                        e.eventType === "hit" &&

                        e.battingSide ===
                            "ourBatting" &&

                        (
                            e.batter ||
                            e.currentBatter
                        ) == batter &&

                        Number(e.inning) ===
                            inningNumber

                    ).length;

                return `<td>${count}</td>`;

            }).join("");

        const playerStats =
            batterStats[i - 1] || {
                hits: 0,
                runs: 0
            };

        rows.push(`
            <tr>

                <td
                    onclick="setRosterName(${i})"
                    style="cursor:pointer"
                >
                    ${name}
                </td>

                ${perInning}

                <td>
                    ${playerStats.hits}
                </td>

                <td>
                    ${playerStats.runs}
                </td>

            </tr>
        `);

    }

    return `
        <div class="card summary-section">

            <h3>
                Batting Stats
            </h3>

            <table class="period-table">

                <tr>

                    <th>
                        Batter
                    </th>

                    ${innings
                        .map(
                            i =>
                            `<th>${i}</th>`
                        )
                        .join("")}

                    <th>
                        Total Hits
                    </th>

                    <th>
                        Runs
                    </th>

                </tr>

                ${rows.join("")}

            </table>

        </div>
    `;

}

function buildSoftballRosterHtml() {
    const roster = App.currentMatch?.roster?.ourTeam || [];

    const rows = [];
    for (let i = 1; i <= 9; i++) {
        const name = roster[i - 1] || `Player #${i}`;
        rows.push(`
            <tr>
                <td>#${i}</td>
                <td>${name}</td>
                <td>
                    <button class="primary-button" onclick="setPitcherFromRoster(${i}, 'pitcher1')">Set Pitcher 1</button>
                </td>
                <td>
                    <button class="primary-button" onclick="setPitcherFromRoster(${i}, 'pitcher2')">Set Pitcher 2</button>
                </td>
            </tr>
        `);
    }

    return `
        <div class="card summary-section">
            <h3>Roster (Our Team)</h3>
            <table class="period-table">
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th colspan="2">Pitchers</th>
                </tr>
                ${rows.join("")}
            </table>
        </div>
    `;
}

window.setPitcherFromRoster = function(index, key) {
    App.currentMatch.roster = App.currentMatch.roster || { ourTeam: [] };
    const name = App.currentMatch.roster.ourTeam[index - 1] || `Player #${index}`;
    App.currentMatch.pitchers = App.currentMatch.pitchers || { ourTeam: {} };
    App.currentMatch.pitchers.ourTeam = App.currentMatch.pitchers.ourTeam || {};
    App.currentMatch.pitchers.ourTeam[key] = App.currentMatch.pitchers.ourTeam[key] || {};
    App.currentMatch.pitchers.ourTeam[key].name = name;
    saveMatch();
    renderSoftballSummary();
}

window.setRosterName = function(index) {
    const name = prompt(`Enter name for player #${index}`);
    if (name !== null) {
        App.currentMatch.roster = App.currentMatch.roster || { ourTeam: [] };
        App.currentMatch.roster.ourTeam[index - 1] = name;
        saveMatch();
        renderSoftballSummary();
    }
}

function renderSoftballSummary() {

    const battingStats =
        getSoftballBatterStats();

    const liveScreen =
        document.getElementById(
            "liveMatchScreen"
        );

    const score = getScore();

    liveScreen.innerHTML = `
        <div id="summaryCapture">
            <div class="summary-screen">

                <div class="card">
                    <div class="summary-title">
                        🥎 Match Summary
                    </div>

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
                            ${getSoftballEventCount(
                                "homeRun",
                                "ourBatting"
                            )}
                        </td>

                        <td>
                            ${getSoftballEventCount(
                                "homeRun",
                                "opponentBatting"
                            )}
                        </td>

                    </tr>

                    <tr>
                        <td>Hits</td>
                        <td>
                            ${getSoftballEventCount(
                                "hit",
                                "ourBatting"
                            )}
                        </td>
                        <td>
                            ${getSoftballEventCount(
                                "hit",
                                "opponentBatting"
                            )}
                        </td>
                    </tr>

                    <tr>
                        <td>Strikes</td>
                        <td>
                            ${getSoftballEventCount(
                                "strike",
                                "ourBatting"
                            )}
                        </td>

                        <td>
                            ${getSoftballEventCount(
                                "strike",
                                "opponentBatting"
                            )}
                        </td>
                    </tr>

                   <tr>
                        <td>Balls</td>
                        <td>
                            ${getSoftballEventCount(
                                "ball",
                                "ourBatting"
                            )}
                        </td>

                        <td>
                            ${getSoftballEventCount(
                                "ball",
                                "opponentBatting"
                            )}
                        </td>
                    </tr>

                    <tr>
                        <td>Outs</td>
                        <td>
                            ${getSoftballEventCount(
                                "out",
                                "ourBatting"
                            )}
                        </td>

                        <td>
                            ${getSoftballEventCount(
                                "out",
                                "opponentBatting"
                            )}
                        </td>
                    </tr>

                </table>

            </div>

            ${buildSoftballBattingStatsHtml()}

            ${buildPitchingSummaryHtml()}

            <div class="summary-actions">

                <button
                    id="summaryExportButton"
                    class="summary-button export">
                    Export Match
                </button>

                <button
                    id="exportPdfButton"
                    class="summary-button exportPDF">
                    📸 Export to PDF
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

    const exportPdfButton =
        document.getElementById(
            "exportPdfButton"
        );

    if (exportPdfButton) {
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
            returnToSoftballHome
        );
}

function returnToSoftballHome() {

    App.currentMatch = null;

    showSoftballMenu();

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

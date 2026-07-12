
/*
=========================================================
MatchIQ
ui.js
Version: 0.4.2
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

    const score =
        getScore();

    alert(

`🏑 Match Finished

${App.currentMatch.ourTeam}: ${score.our}

${App.currentMatch.opponent}: ${score.opposition}

Events Recorded:
${App.currentMatch.events.length}`

    );

}

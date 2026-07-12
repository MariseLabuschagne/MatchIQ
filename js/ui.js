
/*
=========================================================
MatchIQ
ui.js
Version: 0.3.0
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

            <div class="team-name">
                ${App.currentMatch.ourTeam}
            </div>

            <div
                id="scoreDisplay"
                class="score"
            >
                0 - 0
            </div>

            <div class="team-name">
                ${App.currentMatch.opponent}
            </div>

            <div
                id="matchTimer"
                class="timer"
            >
                00:00
            </div>

            <div class="period">
                ${App.currentMatch.period}
            </div>

            <div class="match-controls">

                <button
                    id="pauseButton"
                    class="primary-button"
                >
                    ⏸ Pause
                </button>

                <button
                    id="resetButton"
                    class="primary-button"
                >
                    🔄 Reset
                </button>

                <button
                    id="undoButton"
                    class="primary-button"
                >
                    ↩ Undo
                </button>

                <button
                    id="endMatchButton"
                    class="primary-button"
                >
                    ✅ End
                </button>

            </div>

        </div>

        <div class="card">

            <div id="eventSections"></div>

        </div>

        <div class="card">

            <h2>Timeline</h2>

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
        .getElementById("undoButton")
        .addEventListener(
            "click",
            undoLastEvent
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
                "event-category";

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
                        "primary-button event-button";

                    button.innerHTML = `
                        ${event.icon}<br>
                        ${event.name}
                    `;

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

            const eventName =
                config
                    ? config.name
                    : event.eventType;

            const icon =
                config
                    ? config.icon
                    : "🏑";

            row.innerHTML = `

                <div
                    class="timeline-time"
                >
                    ${formatTime(
                        event.matchSecond
                    )}
                </div>

                <div
                    class="timeline-event"
                >
                    ${icon}
                    ${eventName}
                </div>

            `;

            timeline.appendChild(
                row
            );

        });
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
            "Undo last event?"
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

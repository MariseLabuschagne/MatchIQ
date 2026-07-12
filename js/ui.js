
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
                style="
                    font-size:72px;
                    color:#38bdf8;
                "
            >
                00:00
            </div>

            <div
                class="period"
            >
                ${App.currentMatch.period}
            </div>

            <div
                style="
                    display:flex;
                    gap:12px;
                    justify-content:center;
                    flex-wrap:wrap;
                    margin-top:20px;
                "
            >

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

            <div id="eventSections">
            </div>

        </div>

        <div class="card">

            <h2>Timeline</h2>

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
            "undoButton"
        )
        .addEventListener(
            "click",
            undoLastEvent
        );

    document
        .getElementById(
            "endMatchButton"
        )
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

    container.innerHTML = "";

    MatchIQ.categories.forEach(cat => {

        const title =
            document.createElement("h2");

        title.textContent =
            cat.name;

        title.style.marginTop =
            "20px";

        container.appendChild(
            title
        );

        const grid =
            document.createElement("div");

        grid.style.display =
            "grid";

        grid.style.gridTemplateColumns =
            "repeat(auto-fill,minmax(180px,1fr))";

        grid.style.gap =
            "12px";

        MatchIQ.events
            .filter(
                e =>
                    e.category ===
                    cat.id
            )
            .forEach(event => {

                const btn =
                    document.createElement(
                        "button"
                    );

                btn.className =
                    "primary-button";

                btn.style.height =
                    "95px";

                btn.innerHTML =
                    `${event.icon}<br>${event.name}`;

                btn.addEventListener(
                    "click",
                    () =>
                        recordEvent(
                            event.id
                        )
                );

                grid.appendChild(
                    btn
                );

            });

        container.appendChild(
            grid
        );

    });

}


function undoLastEvent() {

    if (
        confirm(
            "Undo last event?"
        )
    ) {

        removeLastEvent();

    }

    

function endMatch() {

    pauseTimer();

    const score = getScore();

    alert(

`🏑 Match Finished

${App.currentMatch.ourTeam}: ${score.our}

${App.currentMatch.opponent}: ${score.opposition}

Events Recorded:
${App.currentMatch.events.length}`

    );

}




function recordStrike() {

    App.currentMatch.strikes++;

    if (
        App.currentMatch.currentSide ===
        "opponentBatting"
    ) {

        getActivePitcher()
            .strikes++;

    }

    getActivePitcher()
        .strikes++;
        
    recordEvent(
        "strike"
    );

    /*
    Strikeout
    */

    if (
        App.currentMatch.strikes >= 3
    ) {

        App.currentMatch.outs++;
        getActivePitcher()
            .strikeouts++;

        getActivePitcher()
            .outs++;

        recordEvent(
            "out"
        );

        nextBatter();

        App.currentMatch.strikes = 0;
        App.currentMatch.balls = 0;

        /*
        Third out?
        */

        if (
            App.currentMatch.outs >= 3
        ) {

            switchSides();

            renderTimeline();

            return;

        }

    }

    saveMatch();
    updateScoreboard();
    renderTimeline();

}

function recordBall() {

    App.currentMatch.balls++;

    if (
        App.currentMatch.currentSide ===
        "opponentBatting"
    ) {

        getActivePitcher()
            .balls++;

    }

    getActivePitcher()
        .balls++;

    recordEvent("ball");

        if (
        App.currentMatch.balls >= 4
    ) {

        const bases =
            App.currentMatch.bases;

        /*
        Bases loaded
        */

        if (
            bases.first !== null &&
            bases.second !== null &&
            bases.third !== null
        ) {

            recordRun();

            bases.third =
                bases.second;

            bases.second =
                bases.first;

            bases.first =
                getCurrentBatter();
        }

        /*
        1st and 2nd occupied
        */

        else if (
            bases.first !== null &&
            bases.second !== null
        ) {

            bases.third =
                bases.second;

            bases.second =
                bases.first;

            bases.first =
                getCurrentBatter();
        }

        /*
        Only 1st occupied
        */

        else if (
            bases.first !== null
        ) {

            bases.second =
                bases.first;

            bases.first =
                getCurrentBatter();
        }

        /*
        1st not occupied
        */

        else {

            bases.first =
                getCurrentBatter();
        }
        
        App.currentMatch.currentBatter++;

        if (
            App.currentMatch.currentBatter > 9
        ) {

            App.currentMatch.currentBatter = 1;

        }

        App.currentMatch.balls = 0;
        App.currentMatch.strikes = 0;
        getActivePitcher()
            .walks++;

        if (
            App.currentMatch.currentSide ===
            "opponentBatting"
        ) {

            getActivePitcher()
                .walks++;

        }    
        
        recordEvent("walk");
        nextBatter();
        saveMatch();
        updateScoreboard();
        renderTimeline();
        
        return;

    }
}

function recordOut() {

    showOutOptions();

}
function showOutOptions() {

    removeOutcomePanel();

    const container =
        document.querySelector(
            ".sticky-scoreboard"
        );

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "outcomePanel";

    panel.className =
        "card outcome-panel";

    let buttons = "";

    buttons += `
        <button
            class="event-button softball out"
            onclick="recordSpecificOut('batter')"
        >
            ❌<br>
            Batter
        </button>
    `;

    if (
        App.currentMatch.bases.first
    ) {

        buttons += `
            <button
                class="event-button softball out"
                onclick="recordSpecificOut('first')"
            >
                ❌<br>
                1st Base
                (#${App.currentMatch.bases.first})
            </button>
        `;
    }

    if (
        App.currentMatch.bases.second
    ) {

        buttons += `
            <button
                class="event-button softball out"
                onclick="recordSpecificOut('second')"
            >
                ❌<br>
                2nd Base
                (#${App.currentMatch.bases.second})
            </button>
        `;
    }

    if (
        App.currentMatch.bases.third
    ) {

        buttons += `
            <button
                class="event-button softball out"
                onclick="recordSpecificOut('third')"
            >
                ❌<br>
                3rd Base
                (#${App.currentMatch.bases.third})
            </button>
        `;
    }

    panel.innerHTML = `

        <h3 class="outcome-title">

            SELECT OUT

        </h3>

        <div class="event-grid">

            ${buttons}

            <button
                class="event-button outcome-cancel"
                onclick="removeOutcomePanel()"
            >
                ✖<br>
                Cancel
            </button>

        </div>

    `;

    container.appendChild(
        panel
    );

}
function recordSpecificOut(
    position
) {

    if (
        position === "first"
    ) {

        App.currentMatch.bases.first =
            null;

    }

    if (
        position === "second"
    ) {

        App.currentMatch.bases.second =
            null;

    }

    if (
        position === "third"
    ) {

        App.currentMatch.bases.third =
            null;

    }

    if (
        position === "batter"
    ) {

        const side =
            App.currentMatch.currentSide ===
            "ourBatting"
                ? "ourTeam"
                : "opponent";

        App.currentMatch.currentBatter[
            side
        ]++;
    }

    App.currentMatch.outs++;

    recordEvent(
        "out"
    );

    /*
    Three outs
    */

    if (
        App.currentMatch.outs >= 3
    ) {

        switchSides();

        return;

    }

    saveMatch();
    updateScoreboard();
    renderTimeline();
    removeOutcomePanel();

}

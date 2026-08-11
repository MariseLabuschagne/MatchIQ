
/*
=========================================================
MatchIQ
events.js
Version: 2.0.2
Event Engine
=========================================================
*/

/*
=========================================================
EVENT LOOKUP
=========================================================
*/

function getEventDefinition(eventId) {

    return MatchIQ.events.find(
        event => event.id === eventId
    );

}

/*
=========================================================
EVENT CREATION
=========================================================
*/

function createEvent(
    eventType,
    options = {}
) {

    return {

        id:
            crypto.randomUUID(),

        timestamp:
            new Date().toISOString(),

        matchSecond:
            App.timer.seconds,

        period:
            App.currentMatch.period,

        eventType:
            eventType,

        player:
            options.player || null,

        player2:
            options.player2 || null,

        outcome:
            options.outcome || null,

        value:
            options.value || null,

        notes:
            options.notes || ""

    };

}


function startAttack(
    location
) {

    App.currentMatch.attackCounter += 1;

    App.currentMatch.activeAttackId =
        App.currentMatch.attackCounter;

    recordEvent(
        "attackStart",
        {
            value:
                App.currentMatch
                    .activeAttackId
        }
    );

    recordEvent(
        location
    );

}


/*
=========================================================
EVENT RECORDING
=========================================================
*/

function recordEvent(
    eventType,
    options = {}
) {

    if (!App.currentMatch) {

        console.error(
            "No active match."
        );

        return null;

    }

    const eventDefinition =
        getEventDefinition(
            eventType
        );

    if (!eventDefinition) {

        console.error(
            "Unknown event type:",
            eventType
        );

        return null;

    }

    const event = {

        id:
            crypto.randomUUID(),

        timestamp:
            new Date()
                .toISOString(),

        matchSecond:
            App.timer.seconds,

        period:
            App.currentMatch.period,

        eventType:
            eventType,

        scoreAtEvent:
            `${getScore().our}-${getScore().opposition}`,

        phase:
            getEventPhase(
                eventType
            ),

        context:
            getCurrentContext(),

        attackId:
            App.currentMatch
                ? App.currentMatch.activeAttackId
                : null,

        /*
        SOFTBALL SNAPSHOT
        */

        inning:
            App.currentMatch.inning || 1,

        battingSide:
            App.currentMatch.currentSide || "",

        balls:
            App.currentMatch.balls || 0,

        strikes:
            App.currentMatch.strikes || 0,

        outs:
            App.currentMatch.outs || 0,

        runner1st:
            App.currentMatch.bases?.first || "",

        runner2nd:
            App.currentMatch.bases?.second || "",

        runner3rd:
            App.currentMatch.bases?.third || "",

        currentBatter:
            (
                App.currentMatch.sport ===
                "softball" &&
                typeof getCurrentBatter ===
                "function"
            )
                ? getCurrentBatter()
                : "",

        ...options

    };

    App.currentMatch.events.push(
        event
    );

    saveMatch();

    updateScoreboard();

    renderTimeline();

    return event;

}

function getEventPhase(
    eventType
) {

    const event =
        MatchIQ.events.find(
            e =>
                e.id === eventType
        );

    return event
        ? event.category
        : "system";

}


function getCurrentContext() {

    if (
        App.currentMatch.activeAttackId
    ) {

        return "Circle Entry";

    }

    return "General Play";

}


/*
=========================================================
UNDO
=========================================================
*/

function removeLastEvent() {

    if (
        !App.currentMatch ||
        App.currentMatch.events.length === 0
    ) {

        return null;

    }

    const removedEvent =
        App.currentMatch.events.pop();

    saveMatch();

    updateScoreboard();

    renderTimeline();

    console.log(
        "EVENT REMOVED",
        removedEvent
    );

    return removedEvent;

}

/*
=========================================================
EVENT ACCESS HELPERS
=========================================================
*/

function getEvents() {

    if (!App.currentMatch) {

        return [];

    }

    return App.currentMatch.events;

}

function getLastEvent() {

    if (
        !App.currentMatch ||
        App.currentMatch.events.length === 0
    ) {

        return null;

    }

    return App.currentMatch.events[
        App.currentMatch.events.length - 1
    ];

}

function clearEvents() {

    if (!App.currentMatch) {

        return;

    }

    App.currentMatch.events = [];

    saveMatch();

    updateScoreboard();

    renderTimeline();

}

function nextBatter() {

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        App.currentMatch.battingOrder.ourTeam++;

        if (
            App.currentMatch.battingOrder.ourTeam > 9
        ) {

            App.currentMatch.battingOrder.ourTeam = 1;

        }

    }
    else {

        App.currentMatch.battingOrder.opponent++;

        if (
            App.currentMatch.battingOrder.opponent > 9
        ) {

            App.currentMatch.battingOrder.opponent = 1;

        }

    }

}

function getCurrentBatter() {

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        return App.currentMatch.battingOrder.ourTeam;

    }

    return App.currentMatch.battingOrder.opponent;

}

/*
=========================================================
MATCH EVENT SUMMARY
=========================================================
*/

 function getEventSummary() {

    const summary = {};

    MatchIQ.events.forEach(
        event => {

            summary[event.id] =
                getEventCount(
                    event.id
                );

        }
    );

    return summary;

}

/*
=========================================================
SOFTBALL
=========================================================
*/

function getActivePitcherSide() {

    if (
        !App.currentMatch ||
        !App.currentMatch.pitchers
    ) {

        return null;

    }

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        return App.currentMatch
            .pitchers
            .opponent;

    }

    return App.currentMatch
        .pitchers
        .ourTeam;

}

function getActivePitcherName() {

    const side =
        getActivePitcherSide();

    return side[
        `pitcher${side.active}`
    ]?.name || "";

}

function setActivePitcher(
    pitcherNumber
) {

    const side =
        getActivePitcherSide();

    side.active =
        pitcherNumber;

    saveMatch();

    updateScoreboard();

}

function getActivePitcherName() {

    if (
        !App.currentMatch ||
        !App.currentMatch.pitchers
    ) {

        return "";

    }

    const side =
        getActivePitcherSide();

    if (!side) {

        return "";

    }

    return side[
        `pitcher${side.active}`
    ]?.name || "";

}
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


function advanceInning() {

    App.currentMatch.inning++;

    App.currentMatch.strikes = 0;
    App.currentMatch.balls = 0;
    App.currentMatch.outs = 0;

    recordEvent("nextInning");

    saveMatch();
    updateScoreboard();
}

function switchSides() {

    selectedRunner = null;

    const battingSide =
        App.currentMatch.currentSide ===
        "ourBatting"
            ? "ourTeam"
            : "opponent";

    App.currentMatch.currentBatter[
        battingSide
    ]++;

    if (
        App.currentMatch.currentBatter[
            battingSide
        ] > 9
    ) {

        App.currentMatch.currentBatter[
            battingSide
        ] = 1;

    }

    /*
    If OUR team was batting,
    we are changing to opponent.
    Same inning.
    */

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        App.currentMatch.currentSide =
            "opponentBatting";

    }

    /*
    If OPPONENT was batting,
    inning completes and
    increments.
    */

    else {

        App.currentMatch.currentSide =
            "ourBatting";

        App.currentMatch.inning++;

    }

    App.currentMatch.bases = {

        first: null,
        second: null,
        third: null

    };

    App.currentMatch.balls = 0;
    App.currentMatch.strikes = 0;
    App.currentMatch.outs = 0;
    App.currentMatch.hits = 0;

    saveMatch();
    updateScoreboard();
    updatePeriodDisplay();

}

function recordRun() {

    if (
        App.currentMatch.currentSide ===
        "opponentBatting"
    ) {

        getActivePitcher()
            .runsAllowed++;

    }

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        recordEvent(
            "runFor"
        );

    }
    else {

        recordEvent(
            "runAgainst"
        );

    }

    saveMatch();
    updateScoreboard();

}

function undoLastRun() {

    if (!App.currentMatch || !App.currentMatch.events || App.currentMatch.events.length === 0) {
        alert("No events to undo.");
        return;
    }


    const events = App.currentMatch.events;

    // Find the most recent run event (search backwards)
    let runIndex = -1;
    for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].eventType === "runFor" || events[i].eventType === "runAgainst") {
            runIndex = i;
            break;
        }
    }

    if (runIndex === -1) {
        alert("No run events to undo.");
        return;
    }

    const last = events[runIndex];

    // Build confirmation message
    const when = last.matchSecond != null ? `at ${last.matchSecond}s` : last.timestamp || "";
    const score = last.scoreAtEvent ? `score ${last.scoreAtEvent}` : "";
    const player = last.player != null ? `Runner #${last.player}` : "";
    const from = last.from ? `from ${last.from}` : "";
    const pitcherAdjust = last.battingSide === "opponentBatting" ? " This will also decrement the pitcher's runs allowed." : "";

    const msg = `Undo last run ${when} (${score})${player ? ' by ' + player : ''}${from ? ' ' + from : ''}?` + pitcherAdjust;

    if (!confirm(msg)) {
        return;
    }

    // Remove the found run event
    events.splice(runIndex, 1);

    // Try to restore runner to origin base if info available
    try {
        if (last.player != null && last.from) {
            if (!App.currentMatch.bases) {
                App.currentMatch.bases = { first: null, second: null, third: null };
            }

            if (last.from === "batter") {
                // restore batting order's current batter where possible
                if (last.battingSide === "ourBatting") {
                    App.currentMatch.battingOrder.ourTeam = last.currentBatter || App.currentMatch.battingOrder.ourTeam;
                } else if (last.battingSide === "opponentBatting") {
                    App.currentMatch.battingOrder.opponent = last.currentBatter || App.currentMatch.battingOrder.opponent;
                }
            } else {
                App.currentMatch.bases[last.from] = last.player;
            }
        }
    } catch (e) {
        console.error("Failed to restore runner base:", e);
    }

    // Adjust pitcher runs allowed if applicable
    try {
        if (last.battingSide === "opponentBatting") {
            const pitcher = getActivePitcher();
            if (pitcher && typeof pitcher.runsAllowed === "number") {
                pitcher.runsAllowed = Math.max(0, pitcher.runsAllowed - 1);
            }
        }
    } catch (e) {
        console.error("Failed to adjust pitcher runsAllowed:", e);
    }

    saveMatch();
    updateScoreboard();
    renderTimeline();

    alert("Last run undone.");

}

window.undoLastRun = undoLastRun;
function nextBatter() {

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        App.currentMatch.battingOrder.ourTeam++;

        if (
            App.currentMatch.battingOrder.ourTeam > 9
        ) {

            App.currentMatch.battingOrder.ourTeam = 1;

        }

    }
    else {

        App.currentMatch.battingOrder.opponent++;

        if (
            App.currentMatch.battingOrder.opponent > 9
        ) {

            App.currentMatch.battingOrder.opponent = 1;

        }

    }

}

function advanceRunner() {
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

    let buttons = "";

    buttons += `
        <button
            class="event-button softball advance"
            onclick="showAdvanceDestination('batter')"
        >
            🏠<br>
            Batter (#${getCurrentBatter()})
        </button>
    `;

    if (
        App.currentMatch.bases.first
    ) {
        buttons += `
            <button
                class="event-button softball advance"
                onclick="showAdvanceDestination('first')"
            >
                1️⃣<br>
                Runner #${App.currentMatch.bases.first}
            </button>
        `;
    }

    if (
        App.currentMatch.bases.second
    ) {
        buttons += `
            <button
                class="event-button softball advance"
                onclick="showAdvanceDestination('second')"
            >
                2️⃣<br>
                Runner #${App.currentMatch.bases.second}
            </button>
        `;
    }

    if (
        App.currentMatch.bases.third
    ) {
        buttons += `
            <button
                class="event-button softball advance"
                onclick="showAdvanceDestination('third')"
            >
                3️⃣<br>
                Runner #${App.currentMatch.bases.third}
            </button>
        `;
    }

    panel.innerHTML = `
        <h3 class="outcome-title">
            SELECT RUNNER
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

    container.prepend(
        panel
    );
}

function showAdvanceDestination(
    runnerPosition
) {
    const panel =
        document.getElementById(
            "outcomePanel"
        );

    // Build buttons string and omit Home when the selected runner is the batter
    let homeButton = "";

    if (runnerPosition !== 'batter') {
        homeButton = `
            <button
                class="event-button softball advance"
                onclick="moveRunner('${runnerPosition}','home')"
            >
                🏠<br>
                Home
            </button>
        `;
    }

    panel.innerHTML = `
        <h3 class="outcome-title">
            MOVE TO
        </h3>

        <div class="event-grid">

            <button
                class="event-button softball advance"
                onclick="moveRunner('${runnerPosition}','first')"
            >
                1️⃣<br>
                First Base
            </button>

            <button
                class="event-button softball advance"
                onclick="moveRunner('${runnerPosition}','second')"
            >
                2️⃣<br>
                Second Base
            </button>

            <button
                class="event-button softball advance"
                onclick="moveRunner('${runnerPosition}','third')"
            >
                3️⃣<br>
                Third Base
            </button>

            ${homeButton}

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

function moveRunner(
    from,
    to
) {

    const bases =
        App.currentMatch.bases;

    let runner = null;

    /*
    Identify runner
    */

    if (from === "batter") {

        runner =
            getCurrentBatter();

    } else {

        runner =
            bases[from];

    }

    /*
    HOME selected
    */

    if (to === "home") {

        /*
        Remove runner from base
        */

        if (
            from !== "batter"
        ) {

            bases[from] = null;

        }

        /*
        Record run
        */

        if (
            App.currentMatch.currentSide ===
            "ourBatting"
        ) {

            recordEvent(
                "runFor",
                {
                    player: runner,
                    from: from
                }
            );

        } else {

            recordEvent(
                "runAgainst",
                {
                    player: runner,
                    from: from
                }
            );

        }

        /*
        Advance batter only if
        current batter scored
        */

        if (
            from === "batter"
        ) {

            nextBatter();

        }

        recordEvent(
            "advance"
        );

        saveMatch();
        updateScoreboard();
        renderTimeline();
        removeOutcomePanel();

        return;

    }
    /*
    Prevent overwriting
    an occupied base
    */

    if (
        bases[to] !== null
    ) {

        alert(
            "Base already occupied."
        );

        return;

    }

    /*
    Remove runner from
    original base
    */

    if (
        from !== "batter"
    ) {

        bases[from] = null;

    }

    /*
    Move runner
    */

    bases[to] = runner;

    /*
    Advance batting order
    only when batter
    reaches a base.
    */

    if (
        from === "batter"
    ) {

        nextBatter();

    }

    App.currentMatch.balls = 0;
    App.currentMatch.strikes = 0;

    recordEvent(
        "advance"
    );

    saveMatch();
    updateScoreboard();
    renderTimeline();
    removeOutcomePanel();

}
function advanceRunnerPrev() {

    recordEvent(
        "advance",
        {
            batter:
                getCurrentBatter()
        }
    );
    const match =
        App.currentMatch;

    const bases =
        match.bases;

    /*
    Runner on 3rd scores
    */

    if (
        bases.third !== null
    ) {

        if (
            match.currentSide ===
            "ourBatting"
        ) {

            recordEvent(
                "runFor"
            );

        }
        else {

            recordEvent(
                "runAgainst"
            );

        }

    }

    /*
    Move runners forward
    */

    bases.third =
        bases.second;

    bases.second =
        bases.first;

    bases.first =
        getCurrentBatter();

    /*
    Next batter
    */

    nextBatter();

    if (
        match.currentBatter > 9
    ) {

        match.currentBatter = 1;

    }
    
    App.currentMatch.balls = 0;
    App.currentMatch.strikes = 0;

    saveMatch();
    updateScoreboard();

}

function recordHit() {
    recordEvent("hit", {
        batter: getCurrentBatter(),
        timestamp: new Date().toISOString()
    });

    App.currentMatch.balls = 0;
    App.currentMatch.strikes = 0;
    App.currentMatch.hits = (App.currentMatch.hits || 0) + 1;

    saveMatch();
    updateScoreboard();
    renderTimeline();
}

function recordFoul() {
    const batter = getCurrentBatter();

    recordEvent("foul", {
        batter: batter,
        timestamp: new Date().toISOString()
    });

    // Count foul as a strike up to 2 strikes
    if (typeof App.currentMatch.strikes !== "number") {
        App.currentMatch.strikes = 0;
    }

    if (App.currentMatch.strikes < 2) {
        App.currentMatch.strikes++;
    }

    saveMatch();
    updateScoreboard();
    renderTimeline();
}

function recordHomeRun() {

    const bases =
        App.currentMatch.bases;

    const batter =
        getCurrentBatter();

    // If a hit wasn't recorded immediately before the home run for this batter,
    // add a hit event so batting stats include the home run as a hit.
    const last = getLastEvent();
    if (
        !last ||
        last.eventType !== "hit" ||
        (last.batter || last.currentBatter) !== batter
    ) {
        recordEvent("hit", {
            batter: batter,
            timestamp: new Date().toISOString()
        });
    }

    recordEvent(
        "homeRun",
        {
            batter: batter
        }
    );

    /*
    Count everybody who scores:
    Batter + all occupied bases
    */
    let runsScored = 1;

    if (bases.first !== null) {
        runsScored++;
    }

    if (bases.second !== null) {
        runsScored++;
    }

    if (bases.third !== null) {
        runsScored++;
    }

    /*
    Record all runs
    */
    for (let i = 0; i < runsScored; i++) {
        recordRun();
    }

    /*
    Grand Slam / Home Run clears bases
    */
    App.currentMatch.bases = {
        first: null,
        second: null,
        third: null
    };

    nextBatter();

    App.currentMatch.balls = 0;
    App.currentMatch.strikes = 0;

    saveMatch();
    updateScoreboard();
    renderTimeline();
}
window.recordBall = recordBall;
window.recordStrike = recordStrike;
window.recordOut = recordOut;

function getActivePitcher() {

    const side =
        getActivePitcherSide();

    return side[
        `pitcher${side.active}`
    ];

}
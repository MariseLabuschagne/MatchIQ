
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

function getCurrentBatter() {

    if (!App.currentMatch) {
        return null;
    }

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        return App.currentMatch
            .battingOrder
            .ourTeam;
    }

    return App.currentMatch
        .battingOrder
        .opponent;
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

function getActivePitcher() {

    const side =
        getActivePitcherSide();

    if (!side) {
        return null;
    }

    return side[
        `pitcher${side.active}`
    ] || null;
}

function getActivePitcherSide() {

    if (
        !App.currentMatch ||
        !App.currentMatch.pitchers
    ) {

        return null;
    }

    /*
    If OUR team is batting,
    the opposition pitcher is active.

    If OPPOSITION is batting,
    OUR pitcher is active.
    */

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

    if (!App.currentMatch) {
        return;
    }

     /*
    ---------------------------------------------------------
    PREVENT ADDITIONAL STRIKES AFTER THIRD STRIKE
    ---------------------------------------------------------
    If the third-strike outcome panel is already active,
    do not allow another strike to be recorded.
    */

    if (
        App.currentMatch.strikes >= 3
    ) {
        return;
    }    
   
    if (App.currentMatch.strikes >= 3) {

        console.log(
            "Third strike already reached - awaiting outcome."
        );

        showThirdStrikeOutcome();

        return;
    }

    /*
    ---------------------------------------------------------
    SAVE UNDO STATE
    ---------------------------------------------------------
    Save the state BEFORE this tap changes anything.
    */

    saveUndoState();


    /*
    ---------------------------------------------------------
    RECORD STRIKE
    ---------------------------------------------------------
    */

    App.currentMatch.strikes++;


    /*
    ---------------------------------------------------------
    PITCHER STATISTICS
    ---------------------------------------------------------
    Only update OUR pitcher's statistics when the
    OPPONENT is batting.
    */

    if (
        App.currentMatch.currentSide ===
        "opponentBatting"
    ) {

        const pitcher =
            getActivePitcher();

        if (pitcher) {

            pitcher.strikes++;

        }
    }


    /*
    ---------------------------------------------------------
    RECORD TIMELINE EVENT
    ---------------------------------------------------------
    */

    recordEvent(
        "strike"
    );


    /*
    ---------------------------------------------------------
    THIRD STRIKE
    ---------------------------------------------------------
    DO NOT automatically record an out.

    We need to know whether:
    1. Catcher caught it → OUT
    2. Catcher dropped it → SAFE AT 1ST
    */

    if (
        App.currentMatch.strikes === 3
    ) {

        saveMatch();

        updateScoreboard();

        renderTimeline();

        showThirdStrikeOutcome();

        return;
    }


    /*
    ---------------------------------------------------------
    NORMAL STRIKE
    ---------------------------------------------------------
    */

    saveMatch();

    updateScoreboard();

    renderTimeline();
}

function showThirdStrikeOutcome() {

    removeOutcomePanel();

    const container =
        document.getElementById(
            "softballEventSections"
        ) ||
        document.getElementById(
            "eventSections"
        );

    if (!container) {

        console.error(
            "❌ Could not find softball event container."
        );

        return;
    }
    
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
            THIRD STRIKE
        </h3>

        <p style="text-align:center;">
            What happened?
        </p>

        <div class="event-grid">

            <button
                class="event-button softball advance"
                onclick="completeThirdStrikeOut()"
            >
                ⚾<br>
                CAUGHT — OUT
            </button>

            <button
                class="event-button softball advance"
                onclick="thirdStrikeDropped()"
            >
                🏃<br>
                DROPPED — SAFE AT 1ST
            </button>

            <button
                class="event-button outcome-cancel"
                onclick="cancelThirdStrikeOutcome()"
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

// =========================================================
// THIRD STRIKE — CAUGHT
// =========================================================

function completeThirdStrikeOut() {

    if (!App.currentMatch) {
        return;
    }

    const batter =
        getCurrentBatter();

    /*
    ---------------------------------------------------------
    Record the out
    ---------------------------------------------------------
    */

    App.currentMatch.outs++;

    /*
    ---------------------------------------------------------
    Update our pitcher's statistics
    ---------------------------------------------------------
    */

    if (
        App.currentMatch.currentSide ===
        "opponentBatting"
    ) {

        const pitcher =
            getActivePitcher();

        if (pitcher) {

            pitcher.strikeouts++;
            pitcher.outs++;

        }
    }

    /*
    ---------------------------------------------------------
    Record the out event
    ---------------------------------------------------------
    */

    recordEvent(
        "out",
        {
            player: batter,
            reason: "thirdStrikeCaught"
        }
    );

    /*
    ---------------------------------------------------------
    Move to next batter
    ---------------------------------------------------------
    */

    nextBatter();

    /*
    ---------------------------------------------------------
    Reset count for next batter
    ---------------------------------------------------------
    */

    App.currentMatch.strikes = 0;
    App.currentMatch.balls = 0;

    /*
    ---------------------------------------------------------
    Close third-strike options
    ---------------------------------------------------------
    */

    removeOutcomePanel();

    /*
    ---------------------------------------------------------
    Third out
    ---------------------------------------------------------
    */

    if (
        App.currentMatch.outs >= 3
    ) {

        saveMatch();
        updateScoreboard();
        renderTimeline();

        switchSides();

        return;
    }

    /*
    ---------------------------------------------------------
    Save and refresh
    ---------------------------------------------------------
    */

    saveMatch();
    updateScoreboard();
    renderTimeline();
}


// =========================================================
// THIRD STRIKE — DROPPED / SAFE AT FIRST
// =========================================================

function thirdStrikeDropped() {

    if (!App.currentMatch) {
        return;
    }

    const batter =
        getCurrentBatter();

    const bases =
        App.currentMatch.bases;

    /*
    ---------------------------------------------------------
    Batter reaches first base
    ---------------------------------------------------------
    */

    if (
        bases.first !== null &&
        bases.first !== undefined
    ) {

        alert(
            "First base is occupied."
        );

        return;
    }

    bases.first =
        batter;

    /*
    ---------------------------------------------------------
    Record the advance
    ---------------------------------------------------------
    */

    recordEvent(
        "advance",
        {
            player: batter,
            from: "batter",
            to: "first",
            reason: "thirdStrikeDropped"
        }
    );

    /*
    ---------------------------------------------------------
    IMPORTANT:
    This is NOT an out and NOT a strikeout.
    ---------------------------------------------------------
    */

    /*
    Move to next batter
    */

    nextBatter();

    /*
    Reset count for next batter
    */

    App.currentMatch.strikes = 0;
    App.currentMatch.balls = 0;

    /*
    Close third-strike options
    */

    removeOutcomePanel();

    /*
    Save and refresh
    */

    saveMatch();
    updateScoreboard();
    renderTimeline();
}


// =========================================================
// THIRD STRIKE — CANCEL
// =========================================================

function cancelThirdStrikeOutcome() {

    removeOutcomePanel();

    /*
    Leave the third strike recorded and leave the
    current batter/count unchanged so the user can
    decide what actually happened.
    */

    saveMatch();
    updateScoreboard();
    renderTimeline();
}

function recordBall() {

    saveUndoState();

    if (!App.currentMatch) {
        return;
    }

    App.currentMatch.balls++;

    /*
    Only update OUR pitcher's statistics
    when the OPPONENT is batting.
    */

    if (
        App.currentMatch.currentSide ===
        "opponentBatting"
    ) {

        const pitcher =
            getActivePitcher();

        if (pitcher) {
            pitcher.balls++;
        }
    }

    recordEvent(
        "ball"
    );

    /*
    Four balls = walk
    */

    if (
        App.currentMatch.balls >= 4
    ) {

        const bases =
            App.currentMatch.bases;

        const batter =
            getCurrentBatter();

        /*
        Bases loaded
        */

        if (
            bases.first !== null &&
            bases.second !== null &&
            bases.third !== null
        ) {

            recordRun({
                player: bases.third,
                from: "third"
            });

            bases.third =
                bases.second;

            bases.second =
                bases.first;

            bases.first =
                batter;
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
                batter;
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
                batter;
        }

        /*
        1st empty
        */

        else {

            bases.first =
                batter;
        }

        /*
        Pitcher walk statistic
        */

        if (
            App.currentMatch.currentSide ===
            "opponentBatting"
        ) {

            const pitcher =
                getActivePitcher();

            if (pitcher) {
                pitcher.walks++;
            }
        }

        recordEvent(
            "walk"
        );

        App.currentMatch.balls = 0;
        App.currentMatch.strikes = 0;

        nextBatter();

        saveMatch();
        updateScoreboard();
        renderTimeline();

        return;
    }

    saveMatch();
    updateScoreboard();
    renderTimeline();
}

function recordOut() {

    if (!App.currentMatch) {
        return;
    }

    saveUndoState();

    showOutOptions();

}
function showOutOptions() {

    removeOutcomePanel();

    const container =
    document.querySelector(
        "#eventSections, #softballEventSections"
    );

    console.log(container);

/*    const container =
        document.getElementById(
            "eventSections"
        );
*/
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

    container.prepend(panel);

}
function recordSpecificOut(position) {

    if (!App.currentMatch) {
        return;
    }

    const bases =
        App.currentMatch.bases;

    /*
    Runner on a base is out
    */

    if (
        position === "first"
    ) {

        bases.first = null;
    }

    if (
        position === "second"
    ) {

        bases.second = null;
    }

    if (
        position === "third"
    ) {

        bases.third = null;
    }

    /*
    Batter is out.
    The current batter must move
    to the next batter.
    */

    if (
        position === "batter"
    ) {

        nextBatter();
    }

    App.currentMatch.outs++;

    /*
    Record the out before switching sides.
    */

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

        removeOutcomePanel();

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

    if (!App.currentMatch) {
        return;
    }

    selectedRunner = null;

    /*
    OUR team was batting.
    Now opposition bats.
    */

    if (
        App.currentMatch.currentSide ===
        "ourBatting"
    ) {

        App.currentMatch.currentSide =
            "opponentBatting";

    }

    /*
    Opposition was batting.
    Their half-inning is complete,
    so start a new inning with OUR team batting.
    */

    else {

        App.currentMatch.currentSide =
            "ourBatting";

        App.currentMatch.inning++;
    }

    /*
    Reset inning state
    */

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

    renderTimeline();
}

function recordRun(options = {}) {

    const eventType =
        App.currentMatch.currentSide === "ourBatting"
            ? "runFor"
            : "runAgainst";

    /*
    If opposition is batting,
    our active pitcher is charged with the run.
    */

    if (
        App.currentMatch.currentSide ===
        "opponentBatting"
    ) {

        const pitcher = getActivePitcher();

        if (pitcher) {
            pitcher.runsAllowed++;
        }
    }

    recordEvent(
        eventType,
        {
            player:
                options.player ??
                null,

            from:
                options.from ??
                null
        }
    );

    saveMatch();
    updateScoreboard();
    renderTimeline();
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

    if (!App.currentMatch) {
        return;
    }

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

    } else {

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

    saveUndoState();
    
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

        App.currentMatch.balls = 0;
        App.currentMatch.strikes = 0;
    }

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
    
    if (!App.currentMatch) {
        return;
    }

    saveUndoState();
    
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
    
    if (!App.currentMatch) {
        return;
    }

    saveUndoState();
    
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

    if (!App.currentMatch) {
            return;
    }

    saveUndoState();

    const bases =
        App.currentMatch.bases;

    const batter =
        getCurrentBatter();

    /*
    Make sure the home run also counts as a hit.
    */

    const last =
        getLastEvent();

    if (
        !last ||
        last.eventType !== "hit" ||
        (last.batter || last.currentBatter) !== batter
    ) {

        recordEvent(
            "hit",
            {
                batter: batter
            }
        );

        App.currentMatch.hits =
            (App.currentMatch.hits || 0) + 1;
    }

    /*
    Record the home run itself.
    */

    recordEvent(
        "homeRun",
        {
            batter: batter
        }
    );

    /*
    Batter scores.
    */

    recordRun({
        player: batter,
        from: "batter"
    });

    /*
    Runners on base score.
    */

    if (bases.first !== null) {

        recordRun({
            player: bases.first,
            from: "first"
        });
    }

    if (bases.second !== null) {

        recordRun({
            player: bases.second,
            from: "second"
        });
    }

    if (bases.third !== null) {

        recordRun({
            player: bases.third,
            from: "third"
        });
    }

    /*
    Clear bases.
    */

    App.currentMatch.bases = {
        first: null,
        second: null,
        third: null
    };

    /*
    Move to next batter.
    */

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
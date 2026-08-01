
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

        battingSide:
            App.currentMatch?.sport === "softball"
                ? App.currentMatch.currentSide
                : null,

        attackId:
            App.currentMatch
                ? App.currentMatch.activeAttackId
                : null,

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
function recordStrike() {

    App.currentMatch.strikes++;

    recordEvent("strike");

    if (App.currentMatch.strikes >= 3) {

        App.currentMatch.outs++;

        recordEvent("out");
        nextBatter();

        App.currentMatch.strikes = 0;
        App.currentMatch.balls = 0;
    }

    saveMatch();
    updateScoreboard();
}

function recordBall() {

    App.currentMatch.balls++;

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

        recordEvent("walk");
        nextBatter();
        saveMatch();
        updateScoreboard();

        return;

    }
}

function recordOut() {

    showOutOptions();

}
function showOutOptions() {

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

    container.prepend(
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

    if (
        App.currentMatch.inningHalf ===
        "top"
    ) {

        App.currentMatch.inningHalf =
            "bottom";

    } else {

        App.currentMatch.inningHalf =
            "top";

        App.currentMatch.inning++;

    }

    App.currentMatch.currentSide =
        App.currentMatch.currentSide ===
        "ourBatting"
            ? "opponentBatting"
            : "ourBatting";

    App.currentMatch.bases = {

        first: null,
        second: null,
        third: null

    };

    App.currentMatch.balls = 0;
    App.currentMatch.strikes = 0;
    App.currentMatch.outs = 0;

    saveMatch();
    updateScoreboard();
    updatePeriodDisplay();

}function recordRun() {

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

            <button
                class="event-button softball advance"
                onclick="moveRunner('${runnerPosition}','home')"
            >
                🏠<br>
                Home
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
    }
    else {
        runner =
            bases[from];

        bases[from] = null;
    }

    /*
    Runner scores
    */

    if (to === "home") {

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
    Move runner
    */

    bases[to] = runner;

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

function recordHomeRun() {

    const bases =
        App.currentMatch.bases;

    const batter =
        getCurrentBatter();

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

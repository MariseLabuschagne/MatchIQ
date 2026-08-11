/*
=========================================================
MatchIQ
hockey.js
Sport-specific Hockey Code
=========================================================
*/

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

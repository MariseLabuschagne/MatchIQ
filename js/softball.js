/*
=========================================================
MatchIQ
softball.js
Sport-specific Softball Code
=========================================================
*/

function showSoftballSetup() {

    App.selectedSport = "softball";

    hideAllScreens();

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

function renderSoftballSummary() {

    const battingStats =
        getSoftballBatterStats();

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

            ${buildSoftballMatchInsightsHtml()}

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

    console.log("showSoftballMenu fired");

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

    console.log("softballMenuScreen element", screen);

    screen.classList.remove(
        "hidden"
    );

    screen.style.display = "block";
    screen.style.visibility = "visible";

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

function renderSoftballHistory() {

    hideAllScreens();

    const history =
        getMatchHistory("softball");

    const screen =
        document.getElementById(
            "historyScreen"
        );

    screen.classList.remove(
        "hidden"
    );

    screen.innerHTML = `

        <button
            class="action-button secondary-button"
            onclick="showSoftballMenu()"
        >
            ← Softball Menu
        </button>

        <h2>
            Softball Match History
        </h2>

    `;

    if (history.length === 0) {

        screen.innerHTML += `
            <p>
                No softball matches saved.
            </p>
        `;

        return;
    }

    history
        .slice()
        .reverse()
        .forEach(match => {

            const runsFor =
                match.events.filter(
                    e =>
                        e.eventType ===
                        "runFor"
                ).length;

            const runsAgainst =
                match.events.filter(
                    e =>
                        e.eventType ===
                        "runAgainst"
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
                        ${runsFor}
                        -
                        ${runsAgainst}
                    </h2>

                    <p>
                        ${matchDate}
                    </p>

                    <p class="history-events">
                        Events:
                        ${match.events.length}
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
                                deleteHistoricalMatch(
                                    '${match.id}',
                                    'softball'
                                );
                                renderSoftballHistory();
                            "
                        >
                            🗑 Delete
                        </button>

                    </div>

                </div>

            `;
        });

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
};

window.setRosterName = function(index) {
    const name = prompt(`Enter name for player #${index}`);
    if (name !== null) {
        App.currentMatch.roster = App.currentMatch.roster || { ourTeam: [] };
        App.currentMatch.roster.ourTeam[index - 1] = name;
        saveMatch();
        renderSoftballSummary();
    }
};

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

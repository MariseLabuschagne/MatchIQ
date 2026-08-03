
/*
=========================================================
MatchIQ
export.js
Version: 1.1.1
=========================================================
*/



async function exportSummaryPdf() {

    const { jsPDF } =
        window.jspdf;

    const pdf =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );

    const stats =
        getMatchStatistics();

    const score =
        getScore();

    let y = 20;

    pdf.setFontSize(18);

    pdf.text(
        "MatchIQ Match Summary",
        15,
        y
    );

    y += 12;

    pdf.setFontSize(12);

    pdf.text(
        `Competition: ${
            App.currentMatch.competition
        }`,
        15,
        y
    );

    y += 8;

    pdf.text(
        `${App.currentMatch.ourTeam} ${score.our} - ${score.opposition} ${App.currentMatch.opponent}`,
        15,
        y
    );

    y += 12;

    pdf.setFontSize(14);

    pdf.text(
        "Attack Statistics",
        15,
        y
    );

    y += 8;

    pdf.setFontSize(11);

    pdf.text(
        `Circle Entries: ${stats.attack.circleEntries}`,
        20,
        y
    );

    y += 7;

    pdf.text(
        `Goals: ${stats.attack.goalsScored}`,
        20,
        y
    );

    y += 7;

    pdf.text(
        `Penalty Corners Won: ${stats.attack.penaltyCornersWon}`,
        20,
        y
    );

    y += 12;

    pdf.setFontSize(14);

    pdf.text(
        "Defence Statistics",
        15,
        y
    );

    y += 8;

    pdf.setFontSize(11);

    pdf.text(
        `Circle Entries Against: ${stats.defence.circleEntriesAgainst}`,
        20,
        y
    );

    y += 7;

    pdf.text(
        `Penalty Corners Conceded: ${stats.defence.penaltyCornersConceded}`,
        20,
        y
    );

    y += 12;

    pdf.setFontSize(14);

    pdf.text(
        "Coach Insights",
        15,
        y
    );

    y += 8;

    const insights =
        buildHighlights()
            .replace(/<[^>]*>/g, "")
            .split("✅")
            .join("\n✅");

    pdf.setFontSize(11);

    pdf.text(
        insights,
        20,
        y
    );

    pdf.save(
        `MatchIQ-${App.currentMatch.ourTeam}-${App.currentMatch.opponent}.pdf`
    );

}


function exportMatch() {

    if (!App.currentMatch) {

        alert(
            "No active match found."
        );

        return;

    }

    if (
        App.currentMatch.events.length === 0
    ) {

        alert(
            "No events available to export."
        );

        return;

    }

    if (
        App.currentMatch.sport ===
        "softball"
    ) {

        exportSoftballCsv();

    }
    else {

        exportHockeyCsv();

    }

}

function exportHockeyCsv() {

    const rows = [];

    rows.push([

        "Match ID",
        "Competition",
        "Our Team",
        "Opponent",
        "Venue",

        "Time",
        "Match Second",

        "Period",

        "Category",
        "Direction",

        "Attack ID",

        "Event Type",

        "Our Score",
        "Opponent Score"

    ]);

    App.currentMatch.events.forEach(
        event => {

            const eventDefinition =
                MatchIQ.events.find(
                    e =>
                        e.id ===
                        event.eventType
                );

            const category =
                eventDefinition?.category || "";

            let direction = "";

            if (
                category === "attack"
            ) {

                direction = "FOR";

            }
            else if (
                category === "defence"
            ) {

                direction = "AGAINST";

            }

            const scoreParts =
                (
                    event.scoreAtEvent ||
                    "0-0"
                ).split("-");

            rows.push([

                App.currentMatch.id,

                App.currentMatch.competition,

                App.currentMatch.ourTeam,

                App.currentMatch.opponent,

                App.currentMatch.venue,

                formatTime(
                    event.matchSecond
                ),

                event.matchSecond,

                event.period || "",

                category,

                direction,

                event.attackId || "",

                eventDefinition
                    ? eventDefinition.name
                    : event.eventType,

                scoreParts[0] || "0",

                scoreParts[1] || "0"

            ]);

        }
    );

    downloadCsv(
        rows
    );

}

function exportSoftballCsv() {

    const rows = [];

    rows.push([

        "Match ID",
        "Sport",
        "Competition",
        "Our Team",
        "Opponent",
        "Venue",

        "Time",
        "Match Second",

        "Inning",
        "Batting Side",

        "Balls",
        "Strikes",
        "Outs",

        "Runner 1st",
        "Runner 2nd",
        "Runner 3rd",

        "Current Batter",

        "Active Pitcher",
        "Pitcher Balls",
        "Pitcher Strikes",
        "Pitcher Walks",
        "Pitcher Strikeouts",
        "Pitcher Outs",
        "Pitcher Runs Allowed",

        "Event Type",

        "Our Score",
        "Opponent Score"

    ]);

    App.currentMatch.events.forEach(
        event => {

            const eventDefinition =
                MatchIQ.events.find(
                    e =>
                        e.id ===
                        event.eventType
                );

            const activePitcher =
                App.currentMatch?.pitchers?.ourTeam
                    ? App.currentMatch.pitchers.ourTeam[
                        `pitcher${
                            App.currentMatch.pitchers.ourTeam.active
                        }`
                    ]
                    : null;

            const scoreParts =
                (
                    event.scoreAtEvent ||
                    "0-0"
                ).split("-");

            rows.push([

                App.currentMatch.id,

                App.currentMatch.sport || "",

                App.currentMatch.competition,

                App.currentMatch.ourTeam,

                App.currentMatch.opponent,

                App.currentMatch.venue,

                formatTime(
                    event.matchSecond
                ),

                event.matchSecond,

                event.inning || "",

                event.battingSide || "",

                event.balls ?? "",

                event.strikes ?? "",

                event.outs ?? "",

                event.runner1st ?? "",

                event.runner2nd ?? "",

                event.runner3rd ?? "",

                event.currentBatter ?? "",

                activePitcher?.name || "",

                activePitcher?.balls ?? 0,

                activePitcher?.strikes ?? 0,

                activePitcher?.walks ?? 0,

                activePitcher?.strikeouts ?? 0,

                activePitcher?.outs ?? 0,

                activePitcher?.runsAllowed ?? 0,

                eventDefinition
                    ? eventDefinition.name
                    : event.eventType,

                scoreParts[0] || "0",

                scoreParts[1] || "0"

            ]);

        }
    );

    downloadCsv(
        rows
    );

}

/*
=========================================================
FILENAME
=========================================================
*/

function createExportFileName() {

    const team =
        App.currentMatch.ourTeam
            .replaceAll(
                " ",
                "_"
            );

    const opponent =
        App.currentMatch.opponent
            .replaceAll(
                " ",
                "_"
            );

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    return (
        `MatchIQ_${team}` +
        `_vs_${opponent}` +
        `_${today}.csv`
    );

}

function downloadCsv(
    rows
) {

    const csvContent =
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(
                                    value
                                ).replaceAll(
                                    `"`,
                                    `""`
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const link =
        document.createElement(
            "a"
        );

    const fileName =
        createExportFileName();

    const url =
        URL.createObjectURL(
            blob
        );

    link.href = url;

    link.download =
        fileName;

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    URL.revokeObjectURL(
        url
    );

}
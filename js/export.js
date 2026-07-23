
/*
=========================================================
MatchIQ
export.js
Version: 0.9.9
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

    const rows = [];

    rows.push([

        "Match ID",
        "Competition",
        "Our Team",
        "Opponent",
        "Venue",
        "Format",
        "Period Length",
        "Time",
        "Match Second",
        "Period",
        "Attack ID",
        "Event Type",
        "Event Value",
        "Score",
        "Phase",
        "Context"

    ]);

    App.currentMatch.events.forEach(
        event => {

            const eventDefinition =
                MatchIQ.events.find(
                    e =>
                        e.id ===
                        event.eventType
                );

            rows.push([

                App.currentMatch.id,

                App.currentMatch.competition,

                App.currentMatch.ourTeam,

                App.currentMatch.opponent,

                App.currentMatch.venue,

                App.currentMatch.format,

                App.currentMatch.periodLength,

                formatTime(
                    event.matchSecond
                ),

                event.matchSecond,

                event.period,

                event.attackId || "",

                eventDefinition
                    ? eventDefinition.name
                    : event.eventType,

                event.value || "",
                
                event.scoreAtEvent || "",

                event.phase || "",

                event.context || ""

            ]);

        }
    );

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

    link.style.display =
        "none";

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
    
    alert(
        `Match exported successfully:\n${fileName}`
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

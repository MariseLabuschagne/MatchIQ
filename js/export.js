
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

    if (!window.html2canvas) {
        alert(
            "PDF export requires html2canvas. Please refresh the page."
        );
        return;
    }

    const summaryElement =
        document.getElementById(
            "summaryCapture"
        );

    const fileName =
        `MatchIQ-${App.currentMatch.ourTeam}-${App.currentMatch.opponent}.pdf`;

    showPdfLoader();

    if (summaryElement) {
        const pagePdf =
            new jsPDF(
                "p",
                "mm",
                "a4"
            );

        try {
            const canvas =
                await window.html2canvas(
                    summaryElement,
                    {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: null,
                        logging: false
                    }
                );

            const imgData =
                canvas.toDataURL("image/png");

            const pageWidth =
                pagePdf.internal.pageSize.getWidth();
            const pageHeight =
                pagePdf.internal.pageSize.getHeight();

            const margin = 10;
            const availableWidth =
                pageWidth - margin * 2;
            const availableHeight =
                pageHeight - margin * 2;

            const imgProps =
                pagePdf.getImageProperties(
                    imgData
                );

            let imgWidth = availableWidth;
            let imgHeight =
                (imgProps.height * imgWidth) / imgProps.width;

            if (imgHeight > availableHeight) {
                imgHeight = availableHeight;
                imgWidth =
                    (imgProps.width * imgHeight) / imgProps.height;
            }

            const x =
                (pageWidth - imgWidth) / 2;
            const y =
                (pageHeight - imgHeight) / 2;

            pagePdf.addImage(
                imgData,
                "PNG",
                x,
                y,
                imgWidth,
                imgHeight
            );

            pagePdf.save(fileName);
        } finally {
            hidePdfLoader();
        }
        return;
    }

    const pdf =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );

    const score =
        getScore();

    const isSoftball =
        isSoftballSport(App.currentMatch);

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
        `Competition: ${App.currentMatch.competition}`,
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

    if (isSoftball) {
        pdf.setFontSize(14);
        pdf.text(
            "Softball Summary",
            15,
            y
        );

        y += 8;
        pdf.setFontSize(11);

        pdf.text(
            `Innings Completed: ${App.currentMatch.inning}`,
            15,
            y
        );

        y += 7;
        pdf.text(
            `Runs For: ${score.our}`,
            15,
            y
        );

        y += 7;
        pdf.text(
            `Runs Against: ${score.opposition}`,
            15,
            y
        );

        y += 10;
        pdf.setFontSize(14);
        pdf.text(
            "Game Statistics",
            15,
            y
        );

        y += 8;
        pdf.setFontSize(11);

        pdf.text(
            `Hits For: ${getSoftballEventCount("hit", "ourBatting")}`,
            20,
            y
        );

        y += 7;
        pdf.text(
            `Hits Against: ${getSoftballEventCount("hit", "opponentBatting")}`,
            20,
            y
        );

        y += 7;
        pdf.text(
            `Home Runs For: ${getSoftballEventCount("homeRun", "ourBatting")}`,
            20,
            y
        );

        y += 7;
        pdf.text(
            `Home Runs Against: ${getSoftballEventCount("homeRun", "opponentBatting")}`,
            20,
            y
        );

        y += 12;
        pdf.setFontSize(14);
        pdf.text(
            "Game Statistics",
            15,
            y
        );

        y += 8;
        pdf.setFontSize(11);
    } else {
        const stats =
            getMatchStatistics();

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

    }

    pdf.save(fileName);

}

function showPdfLoader() {
    let loader = document.getElementById("pdfLoaderOverlay");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "pdfLoaderOverlay";
        loader.innerHTML = `
            <div class="pdf-loader">
                <div class="pdf-loader-spinner"></div>
                <div class="pdf-loader-text">Generating PDF...</div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.classList.add("visible");
}

function hidePdfLoader() {
    const loader = document.getElementById("pdfLoaderOverlay");
    if (loader) {
        loader.classList.remove("visible");
    }
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

        "Event Timestamp",
        "Recorded Batter",

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

                event.timestamp || "",

                event.batter ?? "",

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
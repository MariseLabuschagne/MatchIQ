
/*
=========================================================
MatchIQ
export.js
Version: 0.9.9
=========================================================
*/

async function saveSummaryImage() {

    const element =
        document.getElementById(
            "summaryCapture"
        );

    if (!element) {

        alert(
            "Summary capture area not found."
        );

        return;

    }

    const canvas =
        await html2canvas(
            element,
            {
                backgroundColor:
                    "#020617",
                scale: 2
            }
        );

    const link =
        document.createElement(
            "a"
        );

    
    const imageData =
        canvas.toDataURL(
            "image/png"
        );

    const newWindow =
        window.open();

    newWindow.document.write(
        `<img
            src="${imageData}"
            style="
                width:100%;
                height:auto;
            "
        >`
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

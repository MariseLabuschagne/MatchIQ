
/*
=========================================================
MatchIQ
timer.js
Version: 0.3.1
=========================================================
*/

/*
=========================================================
START
=========================================================
*/

function startTimer() {

    if (App.timer.running) {
        return;
    }

    App.timer.running = true;

    App.timer.interval =
        setInterval(
            tickTimer,
            1000
        );

}

/*
=========================================================
TICK
=========================================================
*/

function tickTimer() {

    App.timer.seconds++;

    persistTimer();

    updateTimerDisplay();

}

/*
=========================================================
PERSIST TIMER
=========================================================
*/

function persistTimer() {

    if (!App.currentMatch) {
        return;
    }

    App.currentMatch.elapsedSeconds =
        App.timer.seconds;

    saveMatch();

}

/*
=========================================================
PAUSE
=========================================================
*/

function pauseTimer() {

    if (!App.timer.running) {
        return;
    }

    clearInterval(
        App.timer.interval
    );

    App.timer.running = false;

    App.timer.interval = null;

    persistTimer();

}

/*
=========================================================
RESET
=========================================================
*/

function resetTimer() {

    clearInterval(
        App.timer.interval
    );

    App.timer.running = false;

    App.timer.interval = null;

    App.timer.seconds = 0;

    persistTimer();

    updateTimerDisplay();

}

/*
=========================================================
TOGGLE
=========================================================
*/

function toggleTimer() {

    if (App.timer.running) {

        pauseTimer();

        updatePauseButton(
            "▶ Resume"
        );

    } else {

        startTimer();

        updatePauseButton(
            "⏸ Pause"
        );

    }

}

/*
=========================================================
BUTTON UI
=========================================================
*/

function updatePauseButton(
    text
) {

    const button =
        document.getElementById(
            "pauseButton"
        );

    if (!button) {
        return;
    }

    button.textContent = text;

}

/*
=========================================================
DISPLAY
=========================================================
*/

function updateTimerDisplay() {

    const timerElement =
        document.getElementById(
            "matchTimer"
        );

    if (!timerElement) {
        return;
    }

    timerElement.textContent =
        formatTime(
            App.timer.seconds
        );

}

/*
=========================================================
FORMAT
=========================================================
*/

function formatTime(
    totalSeconds
) {

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds % 60;

    return (
        String(minutes)
            .padStart(2, "0") +
        ":" +
        String(seconds)
            .padStart(2, "0")
    );

}

/*
=========================================================
RESTORE
=========================================================
*/

function restoreMatchClock() {

    if (!App.currentMatch) {

        App.timer.seconds = 0;

        return;

    }

    App.timer.seconds =
        Number(
            App.currentMatch.elapsedSeconds || 0
        );

    updateTimerDisplay();

}

/*
=========================================================
HELPERS
=========================================================
*/

function getElapsedSeconds() {

    return App.timer.seconds;

}

function getElapsedMinutes() {

    return (
        App.timer.seconds / 60
    );

}

function getFormattedMatchTime() {

    return formatTime(
        App.timer.seconds
    );

}

function getCurrentPeriodLengthSeconds() {

    if (
        !App.currentMatch
    ) {
        return 0;
    }

    return (
        App.currentMatch.periodLength * 60
    );

}

function getPeriodProgress() {

    const periodLength =
        getCurrentPeriodLengthSeconds();

    if (
        periodLength === 0
    ) {
        return 0;
    }

    return (
        App.timer.seconds /
        periodLength
    );

}

/*
=========================================================
STATUS
=========================================================
*/

function isTimerRunning() {

    return App.timer.running;

}

function hasMatchStarted() {

    return (
        App.timer.seconds > 0
    );

}

function stopTimer() {

    pauseTimer();

}

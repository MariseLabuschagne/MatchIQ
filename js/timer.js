/*
=====================================================
MatchIQ
timer.js
Version: 0.3.0
=====================================================
*/

function startTimer() {

    if (App.timer.running) return;

    App.timer.running = true;

    App.timer.interval = setInterval(() => {

        App.timer.seconds++;

        updateTimerDisplay();

    }, 1000);

}

function pauseTimer() {

    if (!App.timer.running) return;

    clearInterval(App.timer.interval);

    App.timer.running = false;

}

function resetTimer() {

    clearInterval(App.timer.interval);

    App.timer.running = false;

    App.timer.seconds = 0;

    updateTimerDisplay();

}

function toggleTimer() {

    if (App.timer.running) {

        pauseTimer();

        const btn = document.getElementById("pauseButton");

        if (btn) btn.textContent = "Resume";

    } else {

        startTimer();

        const btn = document.getElementById("pauseButton");

        if (btn) btn.textContent = "Pause";

    }

}

function formatTime(seconds) {

    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");

}

function updateTimerDisplay() {

    const timer = document.getElementById("matchTimer");

    if (!timer) return;

    timer.textContent = formatTime(App.timer.seconds);

}
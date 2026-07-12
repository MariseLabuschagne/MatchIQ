
/*
=========================================================
MatchIQ
config.js
Version: 0.3.0
=========================================================
*/

const MatchIQ = {

    app: {

        name: "MatchIQ",

        version: "0.3.0",

        company: "MatchIQ"
    },

    categories: [

        {
            id: "attack",
            name: "Attack"
        },

        {
            id: "defence",
            name: "Defence"
        },

        {
            id: "discipline",
            name: "Discipline"
        }

    ],

    events: [

        // =====================================================
        // ATTACK
        // =====================================================

        {
            id: "goalScored",
            name: "Goal Scored",
            icon: "🥅",
            category: "attack"
        },

        {
            id: "pcWon",
            name: "Penalty Corner Won",
            icon: "🚩",
            category: "attack"
        },

        {
            id: "psWon",
            name: "Penalty Stroke Won",
            icon: "🏑",
            category: "attack"
        },

        // =====================================================
        // DEFENCE
        // =====================================================

        {
            id: "goalConceded",
            name: "Goal Conceded",
            icon: "⚽",
            category: "defence"
        },

        {
            id: "save",
            name: "Goalkeeper Save",
            icon: "🧤",
            category: "defence"
        },

        {
            id: "interception",
            name: "Interception",
            icon: "🛡️",
            category: "defence"
        },

        {
            id: "turnoverWon",
            name: "Turnover Won",
            icon: "✅",
            category: "defence"
        },

        {
            id: "turnoverLost",
            name: "Turnover Lost",
            icon: "❌",
            category: "defence"
        },

        {
            id: "pcConceded",
            name: "Penalty Corner Conceded",
            icon: "🚩",
            category: "defence"
        },

        {
            id: "psConceded",
            name: "Penalty Stroke Conceded",
            icon: "⚠️",
            category: "defence"
        },

        // =====================================================
        // DISCIPLINE
        // =====================================================

        {
            id: "greenCard",
            name: "Green Card",
            icon: "🟩",
            category: "discipline"
        },

        {
            id: "yellowCard",
            name: "Yellow Card",
            icon: "🟨",
            category: "discipline"
        },

        {
            id: "redCard",
            name: "Red Card",
            icon: "🟥",
            category: "discipline"
        }

    ]

};
